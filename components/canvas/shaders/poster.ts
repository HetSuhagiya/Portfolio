import { HASH, SNOISE } from './common';

/**
 * Generative posters: one pattern per project, drawn in the persistent canvas under a DOM slot.
 * Each pattern is the project's idea, not decoration:
 *   0 Publicis Groupe      a calm lattice of fine threads (enterprise reporting layers)
 *   1 Pantherella          a slow woven rib (a framework that holds metrics together)
 *   2 Christopher Ward     a dial on paper: rings, ticks and one hand (time)
 *   3 Dashworx platform    streams converging through stages (the pipeline)
 *   4 Yew Technologies     a dot matrix (one dot, one sale)
 *   5 AI dashboard         chart tiles materialising from noise
 *   6 Schema inference     tangled lines combed parallel
 */

export const POSTER_VERT = /* glsl */ `
uniform vec4 uRect;   // x, y, w, h in pixels (top-left origin)
uniform vec2 uView;   // viewport size in pixels
varying vec2 vUv;
void main() {
  vUv = uv;
  vec2 px = uRect.xy + vec2(uv.x, 1.0 - uv.y) * uRect.zw;
  vec2 ndc = vec2(px.x / uView.x * 2.0 - 1.0, 1.0 - px.y / uView.y * 2.0);
  gl_Position = vec4(ndc, 0.0, 1.0);
}
`;

export const POSTER_FRAG = /* glsl */ `
precision highp float;

uniform int uVariant;
uniform float uTime;
uniform float uHover;
uniform float uAlpha;
uniform float uVel;
uniform vec2 uMouse;
uniform vec4 uRect;
uniform vec3 uTint;
uniform vec3 uBg;

varying vec2 vUv;

${HASH}
${SNOISE}

const float TAU = 6.28318530718;
const vec3 INK = vec3(0.027, 0.031, 0.043);
const vec3 PAPER = vec3(0.929, 0.918, 0.890);

float line(float d, float w) {
  return 1.0 - smoothstep(0.0, w, abs(d));
}

vec3 lattice(vec2 p, float t) {
  vec2 q = p * 5.0;
  q += 0.22 * vec2(sin(q.y * 0.7 + t * 0.2), cos(q.x * 0.6 - t * 0.17));
  vec2 f = fract(q) - 0.5;
  float major = max(line(f.x, 0.02), line(f.y, 0.02));
  vec2 f4 = fract(q * 4.0) - 0.5;
  float minor = max(line(f4.x, 0.05), line(f4.y, 0.05)) * 0.14;
  vec2 cell = floor(q);
  float lit = step(0.72, hash21(cell + floor(t * 0.25)));
  float node = (1.0 - smoothstep(0.02, 0.09, length(fract(q + 0.5) - 0.5))) * (0.5 + lit);
  float sweep = 0.6 + 0.4 * sin(q.x * 0.8 + q.y * 0.5 - t * 0.5);
  vec3 col = INK + uTint * (major * 0.42 * sweep + minor + node * 0.9);
  col += uTint * 0.07 * (1.0 - length(p) * 0.9);
  return col;
}

vec3 weave(vec2 p, float t) {
  vec2 q = p;
  q.x += 0.05 * sin(q.y * 3.0 + t * 0.25);
  q.y += 0.03 * sin(q.x * 4.0 - t * 0.2);
  float rib = sin(q.x * 70.0) * 0.5 + 0.5;
  float knit = sin(q.y * 150.0 + sin(q.x * 70.0) * 1.6) * 0.5 + 0.5;
  float fold = fbm(q * 1.6 + vec2(0.0, t * 0.04)) * 0.5 + 0.5;
  float thread = line(q.y - 0.08 * sin(q.x * 3.0 + t * 0.3), 0.006);
  vec3 base = mix(INK, uTint * 0.5, fold * 0.55);
  vec3 col = base + uTint * rib * knit * 0.3 * (0.4 + fold);
  col += vec3(1.0, 0.92, 0.84) * thread * 0.8;
  return col;
}

vec3 dial(vec2 p, float t) {
  float r = length(p);
  float a = atan(p.y, p.x);
  float rings = line(fract(r * 9.0) - 0.5, 0.03) * 0.35 * step(r, 0.47);
  float guilloche = (sin(a * 36.0 + sin(r * 40.0) * 2.0) * 0.5 + 0.5) * smoothstep(0.3, 0.1, r) * 0.16;
  float ticks60 = line(fract(a / TAU * 60.0) - 0.5, 0.08) * smoothstep(0.4, 0.405, r) * (1.0 - smoothstep(0.425, 0.43, r));
  float ticks12 = line(fract(a / TAU * 12.0) - 0.5, 0.03) * smoothstep(0.36, 0.365, r) * (1.0 - smoothstep(0.44, 0.445, r));
  float ha = -t * 0.35 + TAU * 0.25;
  vec2 hd = vec2(cos(ha), sin(ha));
  float along = dot(p, hd);
  float hand = line(dot(p, vec2(-hd.y, hd.x)), 0.004) * step(-0.06, along) * step(along, 0.39);
  float ma = -t * 0.03 + 1.0;
  vec2 md = vec2(cos(ma), sin(ma));
  float along2 = dot(p, md);
  float hand2 = line(dot(p, vec2(-md.y, md.x)), 0.006) * step(-0.04, along2) * step(along2, 0.26);
  float hub = 1.0 - smoothstep(0.012, 0.016, r);
  float ink = clamp(rings + guilloche + ticks60 * 0.7 + ticks12 + hand2 + hub, 0.0, 1.0);
  vec3 col = mix(PAPER, uTint, ink * 0.9);
  col = mix(col, vec3(0.72, 0.36, 0.0), hand);
  col -= 0.04 * (fbm(p * 3.0) * 0.5 + 0.5);
  return col;
}

vec3 pipeline(vec2 p, float t) {
  float squeeze = 1.0 + 2.6 * exp(-p.x * p.x * 9.0);
  float y = p.y * squeeze;
  float lanes = line(fract(y * 7.0) - 0.5, 0.05);
  float lane = floor(y * 7.0);
  float dash = smoothstep(0.55, 0.9, fract(p.x * 2.2 - t * (0.25 + 0.1 * hash21(vec2(lane, 3.0))) + hash21(vec2(lane, 9.0))));
  float mask = 1.0 - smoothstep(0.4, 0.5, abs(p.y));
  vec3 col = INK + uTint * lanes * (0.14 + dash * 0.75) * mask;
  for (int i = -1; i <= 1; i++) {
    vec2 c = vec2(float(i) * 0.36, 0.0);
    float d = length(p - c);
    float ring = line(d - 0.075, 0.006);
    float core = 1.0 - smoothstep(0.0, 0.03, d);
    vec3 nodeCol = i == 1 ? vec3(1.0, 0.71, 0.28) : uTint;
    col = mix(col, INK, 1.0 - smoothstep(0.06, 0.075, d));
    col += nodeCol * (ring + core * (0.6 + 0.4 * sin(t * 2.0 + float(i))));
  }
  return col;
}

vec3 dots(vec2 p, float t) {
  float n = 26.0;
  vec2 q = p * n;
  vec2 cell = floor(q);
  vec2 f = fract(q) - 0.5;
  float field = fbm(cell * 0.09 + vec2(t * 0.05, 0.0)) * 0.5 + 0.5;
  float rnd = hash21(cell);
  float rad = 0.1 + 0.3 * smoothstep(0.25, 0.8, field);
  float dot_ = 1.0 - smoothstep(rad - 0.06, rad, length(f));
  float cat = floor(hash21(cell * 0.37 + 5.0) * 4.0);
  vec3 c = mix(uTint, vec3(1.0), cat * 0.16);
  c = mix(c, uTint * 0.45, step(2.5, cat) * 0.6);
  float pulse = step(0.985, hash21(cell + floor(t * 2.0)));
  vec3 col = INK + c * dot_ * (0.25 + 0.75 * field + pulse);
  col += vec3(1.0, 0.71, 0.28) * dot_ * step(0.992, rnd);
  return col;
}

vec3 tiles(vec2 p, float t) {
  vec2 q = (p + vec2(0.5, 0.5)) * vec2(3.0, 3.0);
  vec2 cell = floor(q);
  vec2 f = fract(q);
  float id = hash21(cell + 2.0);
  float phase = fract(t * 0.08 + id);
  float born = smoothstep(0.0, 0.12, phase) * (1.0 - smoothstep(0.86, 1.0, phase));
  float pad = 0.07;
  float inside = step(pad, f.x) * step(f.x, 1.0 - pad) * step(pad, f.y) * step(f.y, 1.0 - pad);
  vec2 g = (f - pad) / (1.0 - 2.0 * pad);
  float border = max(line(g.x - 0.0, 0.02), max(line(g.x - 1.0, 0.02), max(line(g.y, 0.02), line(g.y - 1.0, 0.02))));
  float chart = 0.0;
  if (id < 0.5) {
    float bars = 6.0;
    float bi = floor(g.x * bars);
    float bh = (0.2 + 0.7 * hash21(vec2(bi, id * 91.0))) * born;
    float bx = fract(g.x * bars);
    chart = step(0.18, bx) * step(bx, 0.82) * step(g.y, 0.1 + bh * 0.75) * step(0.1, g.y);
  } else {
    float ly = 0.5 + 0.28 * sin(g.x * 5.0 + id * 20.0) * born + 0.1 * sin(g.x * 13.0 + id * 7.0);
    chart = line(g.y - ly, 0.03) + step(g.y, ly) * 0.18;
  }
  float noise = (snoise(p * 40.0 + t) * 0.5 + 0.5) * (1.0 - born) * 0.25;
  vec3 col = INK + uTint * inside * (border * 0.5 + chart * 0.85) * born + uTint * noise * inside;
  col += uTint * 0.05;
  return col;
}

vec3 combed(vec2 p, float t) {
  float amp = 1.0 - smoothstep(-0.25, 0.3, p.x);
  float tangle = fbm(vec2(p.x * 2.6 + t * 0.06, p.y * 5.0)) * 0.2 + snoise(vec2(p.x * 7.0, p.y * 2.0 - t * 0.1)) * 0.05;
  float y = p.y + tangle * amp;
  float lines = line(fract(y * 16.0) - 0.5, 0.07);
  float lane = floor(y * 16.0);
  float bright = 0.35 + 0.65 * hash21(vec2(lane, 1.0));
  float comb = line(p.x - 0.02 - 0.02 * sin(t * 0.5), 0.004) * 0.9;
  float glow = exp(-pow((p.x - 0.02) * 9.0, 2.0)) * 0.12;
  vec3 col = INK + uTint * (lines * bright * (0.35 + 0.65 * (1.0 - amp * 0.5)) + glow);
  col += vec3(1.0) * comb * 0.5;
  return col;
}

vec3 pattern(vec2 p, float t) {
  if (uVariant == 0) return lattice(p, t);
  if (uVariant == 1) return weave(p, t);
  if (uVariant == 2) return dial(p, t);
  if (uVariant == 3) return pipeline(p, t);
  if (uVariant == 4) return dots(p, t);
  if (uVariant == 5) return tiles(p, t);
  return combed(p, t);
}

void main() {
  float aspect = uRect.z / max(uRect.w, 1.0);
  vec2 uv = vUv;

  // Hover distortion: a ripple from the cursor plus a slow warp.
  vec2 m = uv - uMouse;
  m.x *= aspect;
  float md = length(m);
  float ripple = sin(md * 26.0 - uTime * 5.0) * exp(-md * 5.0);
  vec2 warp = vec2(snoise(uv * 3.0 + uTime * 0.25), snoise(uv * 3.0 - uTime * 0.2 + 9.0));
  uv += (normalize(m + 1e-4) * ripple * 0.012 + warp * 0.014) * uHover;
  uv += warp * 0.02 * min(uVel, 1.5);

  // Cover-fit, centred, aspect-corrected coordinates: the short side spans -0.5..0.5.
  vec2 p = uv - 0.5;
  if (aspect > 1.0) p.x *= aspect; else p.y /= aspect;
  p *= mix(1.0, 0.94, uHover);

  float t = uTime;
  vec2 shift = vec2(0.006 + 0.012 * uHover, 0.0) * (0.35 + min(uVel, 1.5));
  vec3 col;
  col.r = pattern(p + shift, t).r;
  col.g = pattern(p, t).g;
  col.b = pattern(p - shift, t).b;

  // Film grain, static.
  col += (hash21(gl_FragCoord.xy) - 0.5) * 0.035;

  gl_FragColor = vec4(mix(uBg, col, uAlpha), 1.0);
}
`;
