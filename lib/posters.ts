/**
 * Poster registry.
 *
 * Generative posters are drawn by the single persistent canvas, positioned under DOM "slots".
 * A slot registers its element here; the engine reads the registry every frame.
 * During a route change, a poster can be handed off from a work card to the case-study hero:
 * the same plane flies from the old rectangle to the new one (the shared-element transition).
 */

export const POSTER_VARIANTS: Record<string, number> = {
  'publicis-groupe': 0,
  pantherella: 1,
  'christopher-ward': 2,
  'dashworx-data-platform': 3,
  'yew-technologies': 4,
  'ai-dashboard-generator': 5,
  'schema-inference-platform': 6,
};

export type Rect = { x: number; y: number; w: number; h: number };

export type PosterSlot = {
  id: number;
  el: HTMLElement;
  slug: string;
  variant: number;
  tint: [number, number, number];
  /** 0..1, set by hover/focus. */
  hover: number;
  /** In or near the viewport (IntersectionObserver). */
  visible: boolean;
  /** Receives a handed-off poster when it mounts. */
  hero: boolean;
  /** Set by the engine while the plane is flying in from another rectangle. */
  from: Rect | null;
  bornAt: number;
  /** Last rectangle the engine measured, in CSS pixels. */
  rect: Rect | null;
};

export const posterSlots = new Map<number, PosterSlot>();

/** A poster in flight between two routes. */
export const handoff: { slug: string | null; rect: Rect | null; expires: number } = {
  slug: null,
  rect: null,
  expires: 0,
};

let nextId = 1;
let observer: IntersectionObserver | null = null;
const byEl = new WeakMap<Element, PosterSlot>();

function getObserver(): IntersectionObserver {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const slot = byEl.get(e.target);
          if (slot) slot.visible = e.isIntersecting;
        }
      },
      { rootMargin: '25% 25% 25% 25%' },
    );
  }
  return observer;
}

export function registerPoster(
  el: HTMLElement,
  slug: string,
  tint: [number, number, number],
  hero = false,
): PosterSlot {
  const now = performance.now();
  const slot: PosterSlot = {
    id: nextId++,
    el,
    slug,
    variant: POSTER_VARIANTS[slug] ?? 0,
    tint,
    hover: 0,
    visible: true,
    hero,
    from: null,
    bornAt: now,
    rect: null,
  };
  if (hero && handoff.slug === slug && handoff.rect && now < handoff.expires) {
    slot.from = handoff.rect;
    handoff.slug = null;
  }
  posterSlots.set(slot.id, slot);
  byEl.set(el, slot);
  getObserver().observe(el);
  return slot;
}

export function unregisterPoster(slot: PosterSlot): void {
  posterSlots.delete(slot.id);
  observer?.unobserve(slot.el);
}

/** Called when a link with a shared poster is clicked: remember where the poster was. */
export function startHandoff(slug: string, sourceEl: Element | null): void {
  let rect: Rect | null = null;
  if (sourceEl) {
    const slot = byEl.get(sourceEl);
    const r = sourceEl.getBoundingClientRect();
    rect = slot?.rect ?? { x: r.left, y: r.top, w: r.width, h: r.height };
    if (r.width < 2 || r.height < 2) rect = null;
  }
  handoff.slug = slug;
  handoff.rect = rect;
  handoff.expires = performance.now() + 2500;
}
