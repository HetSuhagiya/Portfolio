import * as THREE from 'three';
import { FULLSCREEN_VERT } from '../shaders/common';

/** A single oversized triangle that covers the screen: the cheapest way to run a fragment shader. */
export class FullscreenQuad {
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private mesh: THREE.Mesh;
  private geometry: THREE.BufferGeometry;

  constructor() {
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    this.geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    this.mesh = new THREE.Mesh(this.geometry);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
  }

  render(renderer: THREE.WebGLRenderer, material: THREE.Material, target: THREE.WebGLRenderTarget | null): void {
    this.mesh.material = material;
    renderer.setRenderTarget(target);
    renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.geometry.dispose();
  }
}

export function pass(
  fragmentShader: string,
  uniforms: Record<string, THREE.IUniform>,
  vertexShader: string = FULLSCREEN_VERT,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NoBlending,
  });
}

export type RTOptions = {
  type?: THREE.TextureDataType;
  format?: THREE.PixelFormat;
  filter?: THREE.MagnificationTextureFilter;
};

export function createRT(w: number, h: number, o: RTOptions = {}): THREE.WebGLRenderTarget {
  const filter = o.filter ?? THREE.LinearFilter;
  const rt = new THREE.WebGLRenderTarget(Math.max(1, Math.round(w)), Math.max(1, Math.round(h)), {
    type: o.type ?? THREE.HalfFloatType,
    format: o.format ?? THREE.RGBAFormat,
    minFilter: filter,
    magFilter: filter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: false,
  });
  rt.texture.colorSpace = THREE.NoColorSpace;
  return rt;
}

/** Ping-pong render target pair. */
export class DoubleRT {
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;

  constructor(w: number, h: number, o: RTOptions = {}) {
    this.read = createRT(w, h, o);
    this.write = createRT(w, h, o);
  }

  swap(): void {
    const t = this.read;
    this.read = this.write;
    this.write = t;
  }

  dispose(): void {
    this.read.dispose();
    this.write.dispose();
  }
}

/** True when the renderer can draw to float textures (needed by the simulations). */
export function supportsFloatTargets(renderer: THREE.WebGLRenderer): 'float' | 'half' | 'none' {
  if (!renderer.capabilities.isWebGL2) return 'none';
  const ext = renderer.extensions;
  if (ext.has('EXT_color_buffer_float')) return 'float';
  if (ext.has('EXT_color_buffer_half_float')) return 'half';
  return 'none';
}
