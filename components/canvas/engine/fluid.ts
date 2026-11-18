import * as THREE from 'three';
import { DoubleRT, FullscreenQuad, createRT, pass } from './gl';
import {
  ADVECT_FRAG,
  CLEAR_FRAG,
  CURL_FRAG,
  DIVERGENCE_FRAG,
  FLUID_VERT,
  GRADIENT_FRAG,
  PRESSURE_FRAG,
  SPLAT_FRAG,
  VORTICITY_FRAG,
} from '../shaders/fluid';

type Splat = { x: number; y: number; dx: number; dy: number; color: [number, number, number]; radius: number };

const CONFIG = {
  velocityDissipation: 1.6,
  dyeDissipation: 2.4,
  pressureDecay: 0.8,
  curl: 18,
  splatRadius: 0.0022,
  dyeScale: 2,
};

/** Stable-fluids solver. Drives the cursor wake, the page wipe, and pushes the particles around. */
export class Fluid {
  velocity: DoubleRT;
  dye: DoubleRT;
  private divergence: THREE.WebGLRenderTarget;
  private curl: THREE.WebGLRenderTarget;
  private pressure: DoubleRT;
  private texel = new THREE.Vector2();
  private dyeTexel = new THREE.Vector2();
  private queue: Splat[] = [];
  private aspect = 1;
  readonly width: number;
  readonly height: number;

  private mSplat = pass(
    SPLAT_FRAG,
    {
      texelSize: { value: new THREE.Vector2() },
      uTarget: { value: null },
      aspectRatio: { value: 1 },
      color: { value: new THREE.Vector3() },
      point: { value: new THREE.Vector2() },
      radius: { value: 0.01 },
    },
    FLUID_VERT,
  );
  private mAdvect = pass(
    ADVECT_FRAG,
    {
      texelSize: { value: new THREE.Vector2() },
      uVelocity: { value: null },
      uSource: { value: null },
      dt: { value: 0.016 },
      dissipation: { value: 1 },
    },
    FLUID_VERT,
  );
  private mDivergence = pass(DIVERGENCE_FRAG, { texelSize: { value: new THREE.Vector2() }, uVelocity: { value: null } }, FLUID_VERT);
  private mCurl = pass(CURL_FRAG, { texelSize: { value: new THREE.Vector2() }, uVelocity: { value: null } }, FLUID_VERT);
  private mVorticity = pass(
    VORTICITY_FRAG,
    {
      texelSize: { value: new THREE.Vector2() },
      uVelocity: { value: null },
      uCurl: { value: null },
      curl: { value: CONFIG.curl },
      dt: { value: 0.016 },
    },
    FLUID_VERT,
  );
  private mPressure = pass(
    PRESSURE_FRAG,
    { texelSize: { value: new THREE.Vector2() }, uPressure: { value: null }, uDivergence: { value: null } },
    FLUID_VERT,
  );
  private mGradient = pass(
    GRADIENT_FRAG,
    { texelSize: { value: new THREE.Vector2() }, uPressure: { value: null }, uVelocity: { value: null } },
    FLUID_VERT,
  );
  private mClear = pass(
    CLEAR_FRAG,
    { texelSize: { value: new THREE.Vector2() }, uTexture: { value: null }, value: { value: CONFIG.pressureDecay } },
    FLUID_VERT,
  );

  constructor(
    private quad: FullscreenQuad,
    resolution: number,
    aspect: number,
    private iterations: number,
  ) {
    this.aspect = aspect;
    const w = aspect >= 1 ? Math.round(resolution * aspect) : resolution;
    const h = aspect >= 1 ? resolution : Math.round(resolution / aspect);
    this.width = w;
    this.height = h;
    this.texel.set(1 / w, 1 / h);
    const half = { type: THREE.HalfFloatType, filter: THREE.LinearFilter } as const;
    this.velocity = new DoubleRT(w, h, half);
    this.pressure = new DoubleRT(w, h, { type: THREE.HalfFloatType, filter: THREE.NearestFilter });
    this.divergence = createRT(w, h, { type: THREE.HalfFloatType, filter: THREE.NearestFilter });
    this.curl = createRT(w, h, { type: THREE.HalfFloatType, filter: THREE.NearestFilter });
    const dw = w * CONFIG.dyeScale;
    const dh = h * CONFIG.dyeScale;
    this.dyeTexel.set(1 / dw, 1 / dh);
    this.dye = new DoubleRT(dw, dh, half);
    for (const m of [this.mSplat, this.mAdvect, this.mDivergence, this.mCurl, this.mVorticity, this.mPressure, this.mGradient, this.mClear]) {
      m.uniforms.texelSize!.value.copy(this.texel);
    }
  }

  /** x, y in 0..1 (bottom-left origin). dx, dy in simulation texels per second. */
  splat(x: number, y: number, dx: number, dy: number, color: [number, number, number], radius = 1): void {
    if (this.queue.length < 24) this.queue.push({ x, y, dx, dy, color, radius });
  }

  step(renderer: THREE.WebGLRenderer, dt: number): void {
    const q = this.quad;

    // Splats
    if (this.queue.length) {
      const u = this.mSplat.uniforms;
      u.aspectRatio!.value = this.aspect;
      for (const s of this.queue) {
        u.point!.value.set(s.x, s.y);
        u.radius!.value = CONFIG.splatRadius * s.radius;
        u.uTarget!.value = this.velocity.read.texture;
        u.color!.value.set(s.dx, s.dy, 0);
        q.render(renderer, this.mSplat, this.velocity.write);
        this.velocity.swap();
        u.uTarget!.value = this.dye.read.texture;
        u.color!.value.set(s.color[0], s.color[1], s.color[2]);
        q.render(renderer, this.mSplat, this.dye.write);
        this.dye.swap();
      }
      this.queue.length = 0;
    }

    // Vorticity confinement
    this.mCurl.uniforms.uVelocity!.value = this.velocity.read.texture;
    q.render(renderer, this.mCurl, this.curl);
    this.mVorticity.uniforms.uVelocity!.value = this.velocity.read.texture;
    this.mVorticity.uniforms.uCurl!.value = this.curl.texture;
    this.mVorticity.uniforms.dt!.value = dt;
    q.render(renderer, this.mVorticity, this.velocity.write);
    this.velocity.swap();

    // Projection
    this.mDivergence.uniforms.uVelocity!.value = this.velocity.read.texture;
    q.render(renderer, this.mDivergence, this.divergence);
    this.mClear.uniforms.uTexture!.value = this.pressure.read.texture;
    q.render(renderer, this.mClear, this.pressure.write);
    this.pressure.swap();
    this.mPressure.uniforms.uDivergence!.value = this.divergence.texture;
    for (let i = 0; i < this.iterations; i++) {
      this.mPressure.uniforms.uPressure!.value = this.pressure.read.texture;
      q.render(renderer, this.mPressure, this.pressure.write);
      this.pressure.swap();
    }
    this.mGradient.uniforms.uPressure!.value = this.pressure.read.texture;
    this.mGradient.uniforms.uVelocity!.value = this.velocity.read.texture;
    q.render(renderer, this.mGradient, this.velocity.write);
    this.velocity.swap();

    // Advection
    const a = this.mAdvect.uniforms;
    a.dt!.value = dt;
    a.texelSize!.value.copy(this.texel);
    a.uVelocity!.value = this.velocity.read.texture;
    a.uSource!.value = this.velocity.read.texture;
    a.dissipation!.value = CONFIG.velocityDissipation;
    q.render(renderer, this.mAdvect, this.velocity.write);
    this.velocity.swap();

    a.uVelocity!.value = this.velocity.read.texture;
    a.uSource!.value = this.dye.read.texture;
    a.dissipation!.value = CONFIG.dyeDissipation;
    q.render(renderer, this.mAdvect, this.dye.write);
    this.dye.swap();
  }

  dispose(): void {
    this.velocity.dispose();
    this.dye.dispose();
    this.pressure.dispose();
    this.divergence.dispose();
    this.curl.dispose();
    for (const m of [this.mSplat, this.mAdvect, this.mDivergence, this.mCurl, this.mVorticity, this.mPressure, this.mGradient, this.mClear]) {
      m.dispose();
    }
  }
}
