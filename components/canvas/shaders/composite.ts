import { HASH, SNOISE } from './common';

/** Separable 9-tap gaussian blur for the bloom chain. */
export const BLUR_FRAG = /* glsl */ `
precision mediump float;
uniform sampler2D tMap;
uniform vec2 uDir;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tMap, vUv).rgb * 0.227027;
  c += texture2D(tMap, vUv + uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture2D(tMap, vUv - uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture2D(tMap, vUv + uDir * 3.2307692308).rgb * 0.0702702703;
  c += texture2D(tMap, vUv - uDir * 3.2307692308).rgb * 0.0702702703;
  gl_FragColor = vec4(c, 1.0);
}
`;

/**
 * Final composite: particles + bloom + fluid dye + page wipe + velocity chromatic aberration + grain.
 * On the ink theme the signal is light added to darkness; on paper it is ink laid on paper.
 */
export const COMPOSITE_FRAG = /* glsl */ `
precision highp float;

uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform sampler2D tDye;
uniform sampler2D tVel;
uniform vec2 uRes;
uniform float uTime;
uniform float uBloom;
uniform float uDye;
uniform float uCA;
uniform float uGrain;
uniform float uPaper;
uniform vec3 uBgInk;
uniform vec3 uBgPaper;
uniform vec3 uInk;
uniform vec3 uWipeColor;
uniform float uWipe;      // 0..1 position of the sweep
uniform float uWipeAmt;   // 0..1 strength
uniform float uWipeDir;   // +1 or -1
uniform float uHasFluid;

varying vec2 vUv;

${HASH}
${SNOISE}

void main() {
  vec2 uv = vUv;

  // Velocity chromatic aberration: fast fluid splits the channels along its direction.
  vec2 v = texture2D(tVel, uv).xy * uHasFluid;
  vec2 off = clamp(v * uCA, vec2(-0.012), vec2(0.012));

  vec3 scene;
  scene.r = texture2D(tScene, uv + off).r;
  scene.g = texture2D(tScene, uv).g;
  scene.b = texture2D(tScene, uv - off).b;

  vec3 bloom = texture2D(tBloom, uv).rgb;
  vec3 dye = texture2D(tDye, uv).rgb * uHasFluid;

  vec3 light = scene + bloom * uBloom + dye * uDye;

  // Page wipe: a band of signal sweeping across the screen, with a soft organic edge.
  if (uWipeAmt > 0.001) {
    float d = uv.x * 0.82 + (uv.y - 0.5) * 0.18 * uWipeDir;
    if (uWipeDir < 0.0) d = 1.0 - d;
    float warp = snoise(vec2(uv.y * 2.2, uTime * 0.6)) * 0.045 + snoise(vec2(uv.y * 7.0, uTime * 0.9 + 3.0)) * 0.012;
    float edge = mix(-0.35, 1.4, uWipe) + warp;
    float x = d - edge;
    float core = exp(-x * x / 0.0012);
    float glow = exp(-x * x / 0.03);
    float trail = smoothstep(-0.55, 0.0, x) * step(x, 0.0);
    light += uWipeColor * (core * 1.5 + glow * 0.55 + trail * 0.2) * uWipeAmt;
    light += vec3(core) * 0.5 * uWipeAmt;
  }

  // Soft clip so dense regions glow instead of clipping.
  light = 1.0 - exp(-light * 1.35);

  float density = clamp(max(light.r, max(light.g, light.b)) * 1.25, 0.0, 1.0);
  vec3 onInk = uBgInk + light;
  vec3 onPaper = mix(uBgPaper, uInk, density);
  vec3 col = mix(onInk, onPaper, uPaper);

  // Subtle vignette on ink only.
  vec2 q = uv - 0.5;
  col *= mix(1.0 - dot(q, q) * 0.35, 1.0, uPaper);

  // Static film grain.
  float g = hash21(gl_FragCoord.xy) - 0.5;
  col += g * uGrain;

  gl_FragColor = vec4(col, 1.0);
}
`;
