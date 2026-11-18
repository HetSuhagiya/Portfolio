import * as THREE from 'three';
import { POSTER_FRAG, POSTER_VERT } from '../shaders/poster';
import { posterSlots, type PosterSlot, type Rect } from '@/lib/posters';
import { pointer } from '@/lib/pointer';
import { clamp, damp, lerp } from '@/lib/utils';

type Plane = {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  hover: number;
  alpha: number;
  seen: number;
};

const HANDOFF_MS = 850;
const expoOut = (t: number): number => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Draws the generative posters under their DOM slots. One draw call per visible poster,
 * each a rectangle positioned in pixels by the vertex shader.
 */
export class PosterLayer {
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private geometry = new THREE.PlaneGeometry(1, 1);
  private planes = new Map<number, Plane>();
  private frame = 0;
  private bg = new THREE.Color();

  private make(slot: PosterSlot): Plane {
    const material = new THREE.ShaderMaterial({
      vertexShader: POSTER_VERT,
      fragmentShader: POSTER_FRAG,
      uniforms: {
        uRect: { value: new THREE.Vector4() },
        uView: { value: new THREE.Vector2(1, 1) },
        uVariant: { value: slot.variant },
        uTime: { value: 0 },
        uHover: { value: 0 },
        uAlpha: { value: 0 },
        uVel: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uTint: { value: new THREE.Color(slot.tint[0], slot.tint[1], slot.tint[2]) },
        uBg: { value: this.bg },
      },
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    });
    const mesh = new THREE.Mesh(this.geometry, material);
    mesh.frustumCulled = false;
    // PlaneGeometry spans -0.5..0.5; the vertex shader only uses uv.
    this.scene.add(mesh);
    return { mesh, material, hover: 0, alpha: slot.from ? 1 : 0, seen: 0 };
  }

  /** Measure slots (DOM reads, batched) and draw. Returns the number of posters drawn. */
  render(
    renderer: THREE.WebGLRenderer,
    time: number,
    dt: number,
    viewW: number,
    viewH: number,
    bg: THREE.Color,
  ): number {
    this.frame++;
    this.bg.copy(bg);
    const now = performance.now();
    let drawn = 0;

    for (const slot of posterSlots.values()) {
      let plane = this.planes.get(slot.id);
      if (!slot.visible && !slot.from) {
        if (plane) plane.mesh.visible = false;
        continue;
      }
      const r = slot.el.getBoundingClientRect();
      let rect: Rect = { x: r.left, y: r.top, w: r.width, h: r.height };
      if (rect.w < 1 || rect.h < 1) {
        if (plane) plane.mesh.visible = false;
        continue;
      }

      // Shared-element handoff: fly in from where the poster was on the previous route.
      if (slot.from) {
        const t = clamp((now - slot.bornAt) / HANDOFF_MS);
        const e = expoOut(t);
        const f = slot.from;
        rect = { x: lerp(f.x, rect.x, e), y: lerp(f.y, rect.y, e), w: lerp(f.w, rect.w, e), h: lerp(f.h, rect.h, e) };
        if (t >= 1) slot.from = null;
      }
      slot.rect = rect;

      if (rect.x > viewW || rect.y > viewH || rect.x + rect.w < 0 || rect.y + rect.h < 0) {
        if (plane) plane.mesh.visible = false;
        continue;
      }

      if (!plane) {
        plane = this.make(slot);
        this.planes.set(slot.id, plane);
      }
      plane.seen = this.frame;
      plane.mesh.visible = true;
      plane.hover = damp(plane.hover, slot.hover, 6, dt);
      plane.alpha = damp(plane.alpha, 1, 5, dt);

      const u = plane.material.uniforms;
      u.uRect!.value.set(rect.x, rect.y, rect.w, rect.h);
      u.uView!.value.set(viewW, viewH);
      u.uTime!.value = time + slot.variant * 3.7;
      u.uHover!.value = plane.hover;
      u.uAlpha!.value = plane.alpha;
      u.uVel!.value = damp(u.uVel!.value as number, plane.hover > 0.02 ? pointer.speed / 28 : 0, 5, dt);
      if (pointer.active) {
        (u.uMouse!.value as THREE.Vector2).set(
          clamp((pointer.x - rect.x) / rect.w, -0.5, 1.5),
          clamp(1 - (pointer.y - rect.y) / rect.h, -0.5, 1.5),
        );
      }
      drawn++;
    }

    // Drop planes whose slot is gone.
    for (const [id, plane] of this.planes) {
      if (!posterSlots.has(id)) {
        this.scene.remove(plane.mesh);
        plane.material.dispose();
        this.planes.delete(id);
      }
    }

    if (drawn > 0) {
      renderer.setRenderTarget(null);
      renderer.render(this.scene, this.camera);
    }
    return drawn;
  }

  dispose(): void {
    for (const plane of this.planes.values()) plane.material.dispose();
    this.planes.clear();
    this.geometry.dispose();
  }
}
