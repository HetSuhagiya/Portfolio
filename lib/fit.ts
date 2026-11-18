import type { SignalLayout, SignalPreset } from '@/content/types';

/**
 * Fit a particle layout into a DOM rectangle.
 *
 * Scroll scenes reserve an empty "window" in their layout and the signal is fitted into it, so the
 * particles sit beside the copy instead of behind it. Layouts are authored full-screen; this returns
 * the offset and scale that place them inside the window.
 */

type Bounds = {
  /** Half-width. In units of the aspect ratio, unless `square` (then in the same units as hy). */
  hx: number;
  /** Half-height, in screen units (the screen is 2 units tall). */
  hy: number;
  square?: boolean;
};

const BOUNDS: Partial<Record<SignalLayout, Bounds>> = {
  noise: { hx: 1.12, hy: 1.12 },
  thread: { hx: 1.2, hy: 0.26 },
  lattice: { hx: 1.1, hy: 0.94 },
  merge: { hx: 0.94, hy: 0.7 },
  grid: { hx: 0.87, hy: 0.75 },
  bars: { hx: 0.86, hy: 0.66 },
  dots: { hx: 0.96, hy: 0.96 },
  tiles: { hx: 0.8, hy: 0.62 },
  combed: { hx: 1.2, hy: 0.9 },
  pipeline: { hx: 0.82, hy: 0.12 },
  point: { hx: 0.38, hy: 0.38, square: true },
  caret: { hx: 0.02, hy: 0.2, square: true },
};

export type Fit = {
  /** Values to spread into a SignalPreset. */
  x: number;
  y: number;
  scale: number;
  /** Convert a layout coordinate to pixels relative to the window's top-left corner. */
  point: (lx: number, ly: number) => [number, number];
};

/**
 * @param layout  the layout to fit
 * @param target  the window element
 * @param frame   an element that coincides with the viewport while the scene is on screen
 *                (the sticky pin, or the section itself)
 */
export function fitLayout(layout: SignalLayout, target: HTMLElement, frame: HTMLElement, pad = 0): Fit {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const A = W / H;
  const t = target.getBoundingClientRect();
  const f = frame.getBoundingClientRect();
  const left = t.left - f.left;
  const top = t.top - f.top;
  const w = Math.max(1, t.width - pad * 2);
  const h = Math.max(1, t.height - pad * 2);
  const b = BOUNDS[layout] ?? { hx: 1, hy: 1 };
  const hxPx = ((b.square ? b.hx / A : b.hx) * W) / 2;
  const hyPx = (b.hy * H) / 2;
  const scale = Math.min(w / (2 * hxPx), h / (2 * hyPx));
  const cx = left + t.width / 2;
  const cy = top + t.height / 2;
  return {
    x: (cx / W) * 2 - 1,
    y: 1 - (cy / H) * 2,
    scale,
    point: (lx, ly) => [t.width / 2 + (lx * scale * W) / 2, t.height / 2 - (ly * scale * H) / 2],
  };
}

/** A preset fitted into a window. Brightness is reduced as the layout shrinks, so density stays even. */
export function fitted(preset: SignalPreset, fit: Fit): SignalPreset {
  const k = Math.min(1, 0.45 + 0.55 * fit.scale);
  return { ...preset, x: fit.x, y: fit.y, scale: fit.scale, intensity: (preset.intensity ?? 1) * k };
}

/** Local progress of p inside [a, b], clamped to 0..1. */
export function seg(p: number, a: number, b: number): number {
  return Math.min(1, Math.max(0, (p - a) / (b - a)));
}

/** power3.inOut, the site's scrubbed ease. */
export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
