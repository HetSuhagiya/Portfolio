import * as THREE from 'three';
import { DoubleRT, FullscreenQuad, pass } from './gl';
import { POINTS_FRAG, POINTS_VERT, SIM_FRAG } from '../shaders/particles';
import { DECISION_COLOR } from '@/lib/signal';
import { hexToRgb } from '@/lib/utils';

/** The signal: side² particles simulated on the GPU and drawn as additive points. */
export class Particles {
  readonly side: number;
  private pos: DoubleRT;
  private geometry: THREE.BufferGeometry;
  private points: THREE.Points;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private black: THREE.DataTexture;
  private needsReset = true;

  readonly sim: THREE.ShaderMaterial;
  readonly draw: THREE.ShaderMaterial;

  constructor(
    private quad: FullscreenQuad,
    side: number,
    floatType: THREE.TextureDataType,
  ) {
    this.side = side;
    this.pos = new DoubleRT(side, side, { type: floatType, filter: THREE.NearestFilter });

    this.black = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    this.black.needsUpdate = true;

    this.sim = pass(SIM_FRAG, {
      tPos: { value: null },
      tVel: { value: this.black },
      uTexSize: { value: side },
      uTime: { value: 0 },
      uDt: { value: 0.016 },
      uAspect: { value: 1 },
      uA: { value: 0 },
      uB: { value: 0 },
      uMix: { value: 0 },
      uTurb: { value: 0.2 },
      uFlow: { value: 0.3 },
      uSpread: { value: 0.4 },
      uParam: { value: 1 },
      uScale: { value: 1 },
      uOffset: { value: new THREE.Vector2() },
      uSpring: { value: 3.2 },
      uFluid: { value: 0 },
      uVelScale: { value: new THREE.Vector2() },
      uPointer: { value: new THREE.Vector3(0, 0, 0) },
      uReset: { value: 1 },
    });

    const refs = new Float32Array(side * side * 2);
    for (let i = 0; i < side * side; i++) {
      refs[i * 2] = ((i % side) + 0.5) / side;
      refs[i * 2 + 1] = (Math.floor(i / side) + 0.5) / side;
    }
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('aRef', new THREE.BufferAttribute(refs, 2));
    // Positions come from the texture; three still wants a position attribute for draw range.
    this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(side * side * 3), 3));

    const [dr, dg, db] = hexToRgb(DECISION_COLOR);
    this.draw = new THREE.ShaderMaterial({
      vertexShader: POINTS_VERT,
      fragmentShader: POINTS_FRAG,
      uniforms: {
        tPos: { value: null },
        uTexSize: { value: side },
        uAspect: { value: 1 },
        uSize: { value: 2 },
        uTime: { value: 0 },
        uFlow: { value: 0.3 },
        uIntensity: { value: 1 },
        uAccent: { value: 0 },
        uBlink: { value: 0 },
        uColor: { value: new THREE.Color(0.36, 0.95, 0.84) },
        uDecision: { value: new THREE.Color(dr, dg, db) },
      },
      depthTest: false,
      depthWrite: false,
      transparent: true,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
    });
    this.points = new THREE.Points(this.geometry, this.draw);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  /** Snap every particle straight to its target on the next step (first frame, tier change). */
  reset(): void {
    this.needsReset = true;
  }

  step(renderer: THREE.WebGLRenderer, velocity: THREE.Texture | null): void {
    const u = this.sim.uniforms;
    u.tPos!.value = this.pos.read.texture;
    u.tVel!.value = velocity ?? this.black;
    u.uReset!.value = this.needsReset ? 1 : 0;
    this.quad.render(renderer, this.sim, this.pos.write);
    this.pos.swap();
    this.needsReset = false;
  }

  render(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget | null): void {
    this.draw.uniforms.tPos!.value = this.pos.read.texture;
    renderer.setRenderTarget(target);
    renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.pos.dispose();
    this.geometry.dispose();
    this.sim.dispose();
    this.draw.dispose();
    this.black.dispose();
  }
}
