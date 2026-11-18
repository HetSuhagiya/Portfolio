import * as THREE from 'three';
import { FullscreenQuad, createRT, pass, supportsFloatTargets } from './gl';
import { Fluid } from './fluid';
import { Particles } from './particles';
import { PosterLayer } from './posterLayer';
import { BLUR_FRAG, COMPOSITE_FRAG } from '../shaders/composite';
import { LAYOUTS, mixValues, signalStore, type SignalValues } from '@/lib/signal';
import { TIERS, type Tier } from '@/lib/quality';
import { pointer } from '@/lib/pointer';
import { clamp, damp, hexToRgb } from '@/lib/utils';

const MORPH_SECONDS = 1.25;
const CARET = LAYOUTS.indexOf('caret');
const INK = hexToRgb('#07080B');
const PAPER = hexToRgb('#EDEAE3');

const NUM = ['accent', 'turbulence', 'flow', 'spread', 'param', 'x', 'y', 'scale', 'fluid', 'intensity'] as const;

export type EngineOptions = { posters: boolean; reducedMotion: boolean };

/**
 * The whole WebGL pipeline, one frame at a time:
 *   fluid step → particle step → particles to texture → bloom → composite to screen → posters.
 */
export class Engine {
  private quad = new FullscreenQuad();
  private fluid: Fluid | null = null;
  private particles: Particles | null = null;
  private posters = new PosterLayer();
  private scene: THREE.WebGLRenderTarget | null = null;
  private bloomA: THREE.WebGLRenderTarget | null = null;
  private bloomB: THREE.WebGLRenderTarget | null = null;
  private black: THREE.DataTexture;

  private mBlur = pass(BLUR_FRAG, { tMap: { value: null }, uDir: { value: new THREE.Vector2() } });
  private mComposite = pass(COMPOSITE_FRAG, {
    tScene: { value: null },
    tBloom: { value: null },
    tDye: { value: null },
    tVel: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uBloom: { value: 0.9 },
    uDye: { value: 0.55 },
    uCA: { value: 0.000012 },
    uGrain: { value: 0.045 },
    uPaper: { value: 0 },
    uBgInk: { value: new THREE.Color(...INK) },
    uBgPaper: { value: new THREE.Color(...PAPER) },
    uInk: { value: new THREE.Color(0.1, 0.16, 0.29) },
    uWipeColor: { value: new THREE.Color(0.36, 0.95, 0.84) },
    uWipe: { value: 0 },
    uWipeAmt: { value: 0 },
    uWipeDir: { value: 1 },
    uHasFluid: { value: 0 },
  });

  private tier: Tier = TIERS[2]!;
  private floatType: THREE.TextureDataType = THREE.HalfFloatType;
  private width = 1;
  private height = 1;
  private pixelW = 1;
  private pixelH = 1;
  private time = 0;
  private frames = 0;

  // Morph state
  private a = 0;
  private b = 0;
  private mix = 1;
  private cur: SignalValues;
  private paper = 0;
  private bg = new THREE.Color(...INK);
  private wipeSeed = 0;

  /** Called once the first frame has reached the screen. */
  onFirstFrame: (() => void) | null = null;
  /** False when the device cannot render to float textures (the simulations need them). */
  ok = true;

  constructor(
    private renderer: THREE.WebGLRenderer,
    private options: EngineOptions,
  ) {
    const support = supportsFloatTargets(renderer);
    if (support === 'none') this.ok = false;
    this.floatType = support === 'float' ? THREE.FloatType : THREE.HalfFloatType;
    this.black = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    this.black.needsUpdate = true;
    renderer.autoClear = false;
    const base = signalStore.getState().base;
    this.cur = { ...base, rgb: [...base.rgb] };
    this.a = this.b = 0; // start as noise, resolve into the route's layout
    this.b = base.layout;
    this.mix = base.layout === 0 ? 1 : 0;
    this.paper = signalStore.getState().paper ? 1 : 0;
  }

  setTier(index: number): void {
    const tier = TIERS[clamp(index, 0, TIERS.length - 1)]!;
    const prev = this.tier;
    this.tier = tier;
    if (!this.particles || prev.particles !== tier.particles) {
      this.particles?.dispose();
      this.particles = new Particles(this.quad, tier.particles, this.floatType);
      if (this.frames > 0) this.particles.reset();
    }
    this.buildFluid();
    this.buildTargets();
  }

  resize(cssW: number, cssH: number, dpr: number): void {
    this.width = Math.max(1, cssW);
    this.height = Math.max(1, cssH);
    this.pixelW = Math.max(1, Math.round(cssW * dpr));
    this.pixelH = Math.max(1, Math.round(cssH * dpr));
    this.buildFluid();
    this.buildTargets();
  }

  private buildFluid(): void {
    this.fluid?.dispose();
    this.fluid = null;
    const wantFluid = this.tier.fluid > 0 && !this.options.reducedMotion;
    if (wantFluid) this.fluid = new Fluid(this.quad, this.tier.fluid, this.width / this.height, this.tier.pressure);
  }

  private buildTargets(): void {
    this.scene?.dispose();
    this.bloomA?.dispose();
    this.bloomB?.dispose();
    this.scene = createRT(this.pixelW, this.pixelH, { type: THREE.HalfFloatType });
    const bw = this.pixelW / 4;
    const bh = this.pixelH / 4;
    this.bloomA = createRT(bw, bh, { type: THREE.HalfFloatType });
    this.bloomB = createRT(bw, bh, { type: THREE.HalfFloatType });
  }

  private resolve(dt: number): SignalValues {
    const st = signalStore.getState();
    let target: SignalValues;
    if (st.scrub) {
      const { from, to, t } = st.scrub;
      target = mixValues(from, to, t);
      const na = from.layout;
      const nb = to.layout;
      if (na !== this.a || nb !== this.b) {
        // A new pair of layouts took over (the next scene, or a scrub starting). Keep whatever is on
        // screen where it is by re-expressing the current mix in terms of the new pair.
        const shown = this.a === this.b || this.mix > 0.5 ? this.b : this.a;
        if (na === nb) this.mix = t;
        else if (shown === na) this.mix = 0;
        else if (shown === nb) this.mix = 1;
        else this.mix = t;
        this.a = na;
        this.b = nb;
      }
      this.mix = damp(this.mix, t, 14, dt);
    } else {
      target = st.base;
      const L = target.layout;
      if (L !== this.b) {
        if (L === this.a) {
          this.a = this.b;
          this.b = L;
          this.mix = 1 - this.mix;
        } else {
          if (this.mix > 0.5) this.a = this.b;
          this.b = L;
          this.mix = 0;
        }
      }
      this.mix = Math.min(1, this.mix + dt / MORPH_SECONDS);
      if (this.mix >= 1) this.a = this.b;
    }
    const c = this.cur;
    const k = st.scrub ? 10 : 3.4;
    for (const key of NUM) c[key] = damp(c[key], target[key], k, dt);
    for (let i = 0; i < 3; i++) c.rgb[i] = damp(c.rgb[i]!, target.rgb[i]!, k, dt);
    this.paper = damp(this.paper, st.paper ? 1 : 0, 3, dt);
    return c;
  }

  frame(delta: number): void {
    const r = this.renderer;
    const p = this.particles;
    if (!this.ok || !p || !this.scene || !this.bloomA || !this.bloomB) return;

    const dt = clamp(delta, 1 / 240, 1 / 30);
    this.time += dt;
    const reduced = this.options.reducedMotion;
    const aspect = this.width / this.height;
    const s = this.resolve(dt);
    const st = signalStore.getState();

    // ---- Pointer → fluid wake
    const speed = Math.hypot(pointer.dx, pointer.dy);
    pointer.speed = damp(pointer.speed, speed, 10, dt);
    const px = (pointer.x / this.width) * 2 - 1;
    const py = 1 - (pointer.y / this.height) * 2;
    const fluid = this.fluid;
    if (fluid && pointer.active && speed > 0.5 && s.fluid > 0.01) {
      const force = 26 * s.fluid;
      const tint = 0.12 * clamp(speed / 30, 0.15, 1);
      fluid.splat(
        pointer.x / this.width,
        1 - pointer.y / this.height,
        clamp(pointer.dx * force, -1400, 1400),
        clamp(-pointer.dy * force, -1400, 1400),
        [s.rgb[0] * tint, s.rgb[1] * tint, s.rgb[2] * tint],
        0.8,
      );
    }
    pointer.dx = 0;
    pointer.dy = 0;

    // ---- Page wipe
    let wipeT = -1;
    if (st.wipe.at > 0) {
      wipeT = (performance.now() - st.wipe.at) / st.wipe.duration;
      if (wipeT >= 1) wipeT = -1;
    }
    const cu = this.mComposite.uniforms;
    if (wipeT >= 0 && !reduced) {
      const e = wipeT < 0.5 ? 4 * wipeT * wipeT * wipeT : 1 - Math.pow(-2 * wipeT + 2, 3) / 2;
      cu.uWipe!.value = e;
      cu.uWipeAmt!.value = Math.pow(Math.sin(Math.PI * wipeT), 0.6);
      cu.uWipeDir!.value = st.wipe.dir;
      if (fluid) {
        // The sweep drags the fluid with it.
        const edge = -0.35 + 1.75 * e;
        const x = st.wipe.dir > 0 ? edge : 1 - edge;
        for (let i = 0; i < 2; i++) {
          this.wipeSeed = (this.wipeSeed * 16807 + 11) % 2147483647;
          const y = (this.wipeSeed % 1000) / 1000;
          fluid.splat(clamp(x, 0, 1), y, 900 * st.wipe.dir, (y - 0.5) * 300, [s.rgb[0] * 0.2, s.rgb[1] * 0.2, s.rgb[2] * 0.2], 2.4);
        }
      }
    } else {
      cu.uWipeAmt!.value = 0;
    }

    if (fluid) fluid.step(r, dt);

    // ---- Particles
    const su = p.sim.uniforms;
    su.uTime!.value = this.time;
    su.uDt!.value = dt;
    su.uAspect!.value = aspect;
    su.uA!.value = this.a;
    su.uB!.value = this.b;
    su.uMix!.value = this.a === this.b ? 0 : this.mix;
    su.uTurb!.value = reduced ? 0 : s.turbulence;
    su.uFlow!.value = reduced ? 0 : s.flow;
    su.uSpread!.value = s.spread;
    su.uParam!.value = s.param;
    su.uScale!.value = s.scale;
    // Offsets are authored for a landscape screen; narrow screens keep the signal centred.
    (su.uOffset!.value as THREE.Vector2).set(s.x * aspect, s.y);
    su.uSpring!.value = reduced ? 30 : 3.4;
    su.uFluid!.value = fluid ? s.fluid : 0;
    if (fluid) {
      // texels/s → screen units/s
      (su.uVelScale!.value as THREE.Vector2).set((2 * aspect) / fluid.width, 2 / fluid.height);
    }
    const push = pointer.active && !reduced ? clamp(pointer.speed / 22, 0, 1) * (fluid ? 0.25 : 0.9) * s.fluid : 0;
    (su.uPointer!.value as THREE.Vector3).set(px * aspect, py, push);
    p.step(r, fluid ? fluid.velocity.read.texture : null);

    const du = p.draw.uniforms;
    const scaleByHeight = Math.sqrt(this.pixelH / 900);
    du.uAspect!.value = aspect;
    du.uTime!.value = reduced ? 0 : this.time;
    du.uFlow!.value = s.flow;
    // Layouts fitted into a small window are drawn with slightly smaller points so they stay crisp.
    du.uSize!.value = 2.3 * this.tier.pointScale * scaleByHeight * (this.pixelH / this.height) * clamp(0.62 + 0.38 * s.scale, 0.62, 1.15);
    du.uIntensity!.value = s.intensity * (0.5 / this.tier.pointScale ** 0.6) * (1 + this.paper * 0.9);
    du.uAccent!.value = s.accent;
    const caretWeight = this.b === CARET ? this.mix : this.a === CARET ? 1 - this.mix : 0;
    du.uBlink!.value = reduced ? 0 : this.a === this.b && this.a === CARET ? 1 : caretWeight;
    // On paper the particles are drawn white and read as density; the composite lays them down as ink.
    const pw = this.paper;
    (du.uColor!.value as THREE.Color).setRGB(
      s.rgb[0] + (1 - s.rgb[0]) * pw,
      s.rgb[1] + (1 - s.rgb[1]) * pw,
      s.rgb[2] + (1 - s.rgb[2]) * pw,
    );

    r.setRenderTarget(this.scene);
    r.setClearColor(0x000000, 1);
    r.clear(true, false, false);
    p.render(r, this.scene);

    // ---- Bloom (quarter resolution, two separable passes)
    if (this.tier.bloom) {
      const bu = this.mBlur.uniforms;
      bu.tMap!.value = this.scene.texture;
      (bu.uDir!.value as THREE.Vector2).set(2.2 / this.bloomA.width, 0);
      this.quad.render(r, this.mBlur, this.bloomA);
      bu.tMap!.value = this.bloomA.texture;
      (bu.uDir!.value as THREE.Vector2).set(0, 2.2 / this.bloomA.height);
      this.quad.render(r, this.mBlur, this.bloomB);
      bu.tMap!.value = this.bloomB.texture;
      (bu.uDir!.value as THREE.Vector2).set(1.2 / this.bloomA.width, 0);
      this.quad.render(r, this.mBlur, this.bloomA);
      bu.tMap!.value = this.bloomA.texture;
      (bu.uDir!.value as THREE.Vector2).set(0, 1.2 / this.bloomA.height);
      this.quad.render(r, this.mBlur, this.bloomB);
    }

    // ---- Composite
    cu.tScene!.value = this.scene.texture;
    cu.tBloom!.value = this.tier.bloom ? this.bloomB.texture : this.black;
    cu.tDye!.value = fluid ? fluid.dye.read.texture : this.black;
    cu.tVel!.value = fluid ? fluid.velocity.read.texture : this.black;
    cu.uHasFluid!.value = fluid ? 1 : 0;
    (cu.uRes!.value as THREE.Vector2).set(this.pixelW, this.pixelH);
    cu.uTime!.value = this.time;
    cu.uPaper!.value = this.paper;
    (cu.uInk!.value as THREE.Color).setRGB(s.rgb[0], s.rgb[1], s.rgb[2]);
    (cu.uWipeColor!.value as THREE.Color).setRGB(s.rgb[0], s.rgb[1], s.rgb[2]);
    this.quad.render(r, this.mComposite, null);

    // ---- Posters
    if (this.options.posters) {
      this.bg.setRGB(
        INK[0] + (PAPER[0] - INK[0]) * this.paper,
        INK[1] + (PAPER[1] - INK[1]) * this.paper,
        INK[2] + (PAPER[2] - INK[2]) * this.paper,
      );
      this.posters.render(r, this.time, dt, this.width, this.height, this.bg);
    }

    this.frames++;
    if (this.frames === 2 && this.onFirstFrame) {
      this.onFirstFrame();
      this.onFirstFrame = null;
    }
  }

  dispose(): void {
    this.fluid?.dispose();
    this.particles?.dispose();
    this.posters.dispose();
    this.scene?.dispose();
    this.bloomA?.dispose();
    this.bloomB?.dispose();
    this.mBlur.dispose();
    this.mComposite.dispose();
    this.quad.dispose();
    this.black.dispose();
  }
}
