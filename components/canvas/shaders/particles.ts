import { HASH, SNOISE } from './common';

/**
 * GPGPU particle simulation: the signal.
 *
 * Each texel of the position texture is one particle: (x, y, s, speed).
 *   x, y   position in screen units (x: -aspect..aspect, y: -1..1)
 *   s      position along the thread, 0..1 (used for the travelling shimmer)
 *   speed  screen units per second (used for size and brightness)
 *
 * Every particle is pulled toward a target given by a "layout" function. The engine morphs between
 * two layouts (uA → uB by uMix), adds curl-noise turbulence and advects by the fluid velocity.
 *
 * Layout indices must match LAYOUTS in lib/signal.ts.
 */
export const SIM_FRAG = /* glsl */ `
precision highp float;

uniform sampler2D tPos;
uniform sampler2D tVel;
uniform float uTexSize;
uniform float uTime;
uniform float uDt;
uniform float uAspect;
uniform int uA;
uniform int uB;
uniform float uMix;
uniform float uTurb;
uniform float uFlow;
uniform float uSpread;
uniform float uParam;
uniform float uScale;
uniform vec2 uOffset;
uniform float uSpring;
uniform float uFluid;
uniform vec2 uVelScale;
uniform vec3 uPointer; // xy in screen units, z = strength
uniform float uReset;

varying vec2 vUv;

${HASH}
${SNOISE}

const float TAU = 6.28318530718;

vec2 gauss(vec2 pid) {
  // Cheap approximately-normal 2D offset.
  vec2 a = hash22(pid + 3.1) + hash22(pid + 11.7) + hash22(pid + 29.3) + hash22(pid + 47.9);
  return (a - 2.0) * 0.866;
}

vec2 curl(vec2 p) {
  float e = 0.08;
  float a = snoise(p + vec2(0.0, e));
  float b = snoise(p - vec2(0.0, e));
  float c = snoise(p + vec2(e, 0.0));
  float d = snoise(p - vec2(e, 0.0));
  return vec2(a - b, d - c) / (2.0 * e);
}

float threadY(float s, float t) {
  return 0.16 * sin(s * 4.2 + t * 1.3) + 0.06 * sin(s * 9.7 - t * 0.9 + 1.3) + 0.018 * sin(s * 23.0 + t * 2.1);
}

// Returns (x, y, s).
vec3 layoutPos(int id, vec2 pid) {
  float A = uAspect;
  float t = uTime * uFlow;
  float h1 = hash21(pid + 1.3);
  float h2 = hash21(pid + 57.1);
  float h3 = hash21(pid + 113.9);
  float h4 = hash21(pid + 211.7);
  vec2 g = gauss(pid);
  // Most particles sit in a tight core, a few form a loose halo.
  float halo = mix(0.006, 0.075, pow(h4, 7.0)) * uSpread * 2.2;

  if (id == 0) {
    // noise: raw, unmodelled
    vec2 r = hash22(pid + 5.5) * 2.0 - 1.0;
    vec2 p = r * vec2(A, 1.0) * 1.12;
    p += 0.06 * vec2(sin(uTime * 0.21 + h1 * TAU), cos(uTime * 0.17 + h2 * TAU));
    return vec3(p, h1);
  }
  if (id == 1) {
    // thread: one luminous line
    float s = h1;
    float x = (s * 2.0 - 1.0) * A * 1.2;
    float y = threadY(s, t);
    return vec3(x + g.x * halo * 0.3, y + g.y * halo, s);
  }
  if (id == 2) {
    // lattice: many fine threads, calm and large
    if (h2 < 0.6) {
      float n = 9.0;
      float i = floor(h3 * n);
      float ly = ((i + 0.5) / n * 2.0 - 1.0) * 0.94;
      float s = h1;
      float x = (s * 2.0 - 1.0) * A * 1.2;
      float y = ly + 0.03 * sin(s * 6.0 + t + i * 1.7);
      return vec3(x, y + g.y * halo * 0.25, s);
    }
    float n = max(6.0, floor(8.0 * A));
    float i = floor(h3 * n);
    float lx = ((i + 0.5) / n * 2.0 - 1.0) * A * 1.08;
    float s = h1;
    float y = (s * 2.0 - 1.0) * 1.15;
    float x = lx + 0.03 * sin(s * 5.0 + t * 0.8 + i * 2.1) + y * 0.16;
    return vec3(x + g.x * halo * 0.25, y, s);
  }
  if (id == 3) {
    // merge: five sources become one stream
    float K = 5.0;
    float i = floor(h3 * K);
    float sy = ((i + 0.5) / K * 2.0 - 1.0) * 0.62;
    float sx = -A * 0.9;
    if (h2 < 0.13) {
      float ang = h1 * TAU + uTime * 0.4;
      float rr = 0.032 + 0.006 * sin(uTime * 2.0 + i);
      return vec3(sx + cos(ang) * rr, sy + sin(ang) * rr, 0.0);
    }
    float s = h1;
    float x = mix(sx, A * 1.25, s);
    float m = smoothstep(-A * 0.6, A * 0.1, x);
    // uParam = how merged the sources are: 0 five separate streams, 1 one stream.
    m = m * m * (3.0 - 2.0 * m) * uParam;
    float wob = 0.035 * sin(s * 9.0 - t * 1.6 + i * 1.9) * (1.0 - m * 0.5);
    float y = mix(sy, 0.0, m) + wob;
    float w = halo * mix(0.5, 1.0, m);
    return vec3(x, y + g.y * w, s);
  }
  if (id == 4) {
    // grid: owned, ordered
    float rows = 12.0;
    float cols = max(5.0, floor(rows * A * 1.05));
    vec2 cell = floor(vec2(h1 * cols, h2 * rows));
    vec2 c = (cell + 0.5) / vec2(cols, rows) * 2.0 - 1.0;
    vec2 p = c * vec2(A * 0.86, 0.74);
    // Keep each dot a soft cluster of the same on-screen size when the grid is fitted into a window.
    p += g * (0.004 + 0.006 * uSpread) / max(uScale, 0.4);
    return vec3(p, c.x * 0.5 + 0.5);
  }
  if (id == 5) {
    // bars: the grid blooms into a chart
    float B = max(7.0, floor(8.0 * A));
    float i = floor(h1 * B);
    float trend = 0.34 + 0.66 * (i / (B - 1.0));
    float hgt = (0.35 + 0.65 * hash21(vec2(i, 7.0))) * trend;
    float bw = (1.7 * A) / B;
    float x = ((i + 0.5) / B * 2.0 - 1.0) * A * 0.85 + (h2 - 0.5) * bw * 0.56;
    float y = -0.62 + h3 * hgt * 1.25 * mix(0.12, 1.0, uParam);
    return vec3(x, y, (i + 0.5) / B);
  }
  if (id == 6) {
    // dots: every dot is a sale
    float rows = 30.0;
    float cols = floor(rows * A);
    vec2 cell = floor(vec2(h1 * cols, h2 * rows));
    vec2 c = (cell + 0.5) / vec2(cols, rows) * 2.0 - 1.0;
    vec2 p = c * vec2(A * 0.96, 0.96);
    float breathe = 0.5 + 0.5 * sin(uTime * 0.6 + hash21(cell) * TAU);
    p += g * (0.0025 + 0.002 * breathe);
    return vec3(p, hash21(cell + 9.0));
  }
  if (id == 7) {
    // caret: the thread as a typing cursor
    float y = (h1 - 0.5) * 0.4;
    return vec3(g.x * 0.0035, y, h1);
  }
  if (id == 8) {
    // tiles: chart tiles
    float i = floor(h1 * 6.0);
    vec2 ci = vec2(mod(i, 3.0), floor(i / 3.0));
    vec2 ext = vec2(A * 0.78, 0.6);
    vec2 center = (vec2((ci.x + 0.5) / 3.0, (ci.y + 0.5) / 2.0) * 2.0 - 1.0) * ext;
    vec2 half_ = vec2(ext.x / 3.0, ext.y / 2.0) * 0.86;
    vec2 q;
    if (h2 < 0.36) {
      // mini bars inside the tile
      float bar = floor(h3 * 6.0);
      float bh = 0.25 + 0.75 * hash21(vec2(i * 3.0 + 1.0, bar));
      q = vec2((bar + 0.5) / 6.0 * 1.5 - 0.75 + (h4 - 0.5) * 0.12, -0.78 + hash21(pid + 301.0) * bh * 1.45);
    } else {
      float pr = h3 * 4.0;
      float f = fract(pr) * 2.0 - 1.0;
      if (pr < 1.0) q = vec2(f, 1.0);
      else if (pr < 2.0) q = vec2(1.0, f);
      else if (pr < 3.0) q = vec2(f, -1.0);
      else q = vec2(-1.0, f);
    }
    return vec3(center + q * half_ + g * 0.002, h3);
  }
  if (id == 9) {
    // combed: tangled on the left, parallel on the right. uParam = how tangled.
    float n = 14.0;
    float i = floor(h3 * n);
    float ly = ((i + 0.5) / n * 2.0 - 1.0) * 0.8;
    float s = h1;
    float x = (s * 2.0 - 1.0) * A * 1.2;
    float tang = uParam * (1.0 - smoothstep(0.28, 0.72, s));
    float y = ly + tang * (0.34 * sin(s * 7.0 + i * 2.4 + t) + 0.2 * sin(s * 13.0 + i * 5.1 - t * 0.7) + 0.1 * sin(s * 29.0 + i));
    return vec3(x, y + g.y * halo * 0.2, s);
  }
  if (id == 10) {
    // pipeline: stages on a line
    if (h2 < 0.42) {
      float j = floor(h3 * 4.0);
      float ang = h1 * TAU + uTime * (0.25 + 0.1 * j);
      vec2 c = vec2((j / 3.0 * 2.0 - 1.0) * A * 0.72, 0.0);
      float rr = 0.085 * (1.0 + 0.06 * sin(uTime * 1.7 + j * 1.3)) + g.x * 0.003;
      return vec3(c + vec2(cos(ang), sin(ang)) * rr, (j + 0.5) / 4.0);
    }
    float s = h1;
    float x = (s * 2.0 - 1.0) * A * 1.2;
    float y = 0.012 * sin(s * 30.0 - t * 4.0);
    return vec3(x, y + g.y * halo * 0.3, s);
  }
  if (id == 11) {
    // point: everything converges on a decision
    float ang = h1 * TAU + uTime * (0.15 + 0.5 * h2);
    float rr = 0.03 + 0.34 * pow(h3, 3.2);
    rr *= 1.0 + 0.08 * sin(uTime * 1.3 + h1 * TAU);
    return vec3(vec2(cos(ang), sin(ang)) * rr, h1);
  }
  // 12 broken: the thread with a gap. uParam = gap size.
  float s = h1;
  float x = (s * 2.0 - 1.0) * A * 1.2;
  float y = threadY(s, t);
  float gap = uParam * 0.3 * A;
  float inside = 1.0 - smoothstep(gap * 0.6, gap, abs(x));
  float sgn = x < 0.0 ? -1.0 : 1.0;
  x = mix(x, sgn * gap * (0.95 + 0.3 * h2), inside * step(0.001, uParam));
  y += inside * (h3 - 0.5) * 0.5 * uParam + inside * -0.12 * uParam;
  return vec3(x + g.x * halo * 0.3, y + g.y * halo, s);
}

void main() {
  vec2 pid = floor(vUv * uTexSize);
  vec4 prev = texture2D(tPos, vUv);
  float h = hash21(pid + 401.3);

  vec3 a = layoutPos(uA, pid);
  vec3 target = a;
  if (uA != uB && uMix > 0.0005) {
    vec3 b = layoutPos(uB, pid);
    // Stagger the morph per particle so the swarm does not move in lockstep.
    float m = clamp(uMix * 1.55 - h * 0.55, 0.0, 1.0);
    m = m * m * (3.0 - 2.0 * m);
    target = mix(a, b, m);
  }
  target.xy = target.xy * uScale + uOffset;

  vec2 pos = prev.xy;
  if (uReset > 0.5) pos = target.xy;

  vec2 toTarget = target.xy - pos;
  float k = 1.0 - exp(-uSpring * (0.55 + 0.9 * h) * uDt);
  vec2 next = pos + toTarget * k;

  vec2 c = curl(pos * 1.25 + vec2(0.0, uTime * 0.12) + h * 0.15);
  next += c * uTurb * 0.22 * uDt;

  vec2 suv = vec2(pos.x / uAspect, pos.y) * 0.5 + 0.5;
  vec2 fv = texture2D(tVel, suv).xy * uVelScale;
  next += fv * uFluid * uDt;

  // Direct pointer push: keeps the thread reactive even when the fluid is off.
  vec2 d = pos - uPointer.xy;
  float dist2 = dot(d, d);
  next += normalize(d + 1e-5) * uPointer.z * exp(-dist2 / 0.012) * uDt;

  float speed = length(next - pos) / max(uDt, 1e-4);
  gl_FragColor = vec4(next, target.z, mix(prev.w, speed, 0.25));
}
`;

export const POINTS_VERT = /* glsl */ `
precision highp float;

uniform sampler2D tPos;
uniform float uTexSize;
uniform float uAspect;
uniform float uSize;
uniform float uTime;
uniform float uFlow;
uniform float uIntensity;
uniform float uAccent;
uniform float uBlink;
uniform vec3 uColor;
uniform vec3 uDecision;

attribute vec2 aRef;

varying vec3 vColor;
varying float vAlpha;

${HASH}

void main() {
  vec4 p = texture2D(tPos, aRef);
  vec2 pid = floor(aRef * uTexSize);
  float h = hash21(pid + 77.7);
  float h2 = hash21(pid + 191.3);

  gl_Position = vec4(p.x / uAspect, p.y, 0.0, 1.0);

  float speed = min(p.w, 3.0);
  float twinkle = 0.62 + 0.38 * sin(uTime * (0.8 + h * 2.4) + h * 40.0);
  // A pulse of brightness travels along the thread: the signal itself.
  float wave = sin((p.z * 3.0 - uTime * (0.25 + uFlow * 0.9)) * 6.2831853);
  float shimmer = 0.5 + 0.5 * smoothstep(0.55, 1.0, wave);
  float blink = mix(1.0, 0.25 + 0.75 * smoothstep(-0.2, 0.2, sin(uTime * 5.2)), uBlink);

  vAlpha = uIntensity * twinkle * shimmer * blink * (0.35 + 0.65 * h2) * (1.0 + speed * 0.35);
  // The decision colour arrives along the thread, from the leading end backward.
  float acc = smoothstep(0.0, 1.0, clamp(uAccent * 1.6 - (1.0 - p.z) * 0.6, 0.0, 1.0));
  vColor = mix(uColor, uDecision, acc);

  gl_PointSize = uSize * (0.55 + 1.1 * h * h) * (1.0 + speed * 0.3);
}
`;

export const POINTS_FRAG = /* glsl */ `
precision highp float;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = dot(d, d) * 4.0;
  float a = exp(-r * 3.2) * (1.0 - smoothstep(0.8, 1.0, r));
  gl_FragColor = vec4(vColor * a * vAlpha, 1.0);
}
`;
