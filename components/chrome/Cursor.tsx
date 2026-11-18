'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { attachPointer } from '@/lib/pointer';
import { isCoarsePointer, prefersReducedMotion } from '@/lib/utils';

/**
 * Custom cursor: a dot and a ring. Desktop fine pointers only; never mounted on touch.
 * Its fluid wake is drawn by the stage (the engine reads the same pointer).
 * Elements can label the ring with data-cursor="Open" (or Drag, Play…).
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const detach = attachPointer();
    if (isCoarsePointer()) return detach;
    const d = dot.current;
    const r = ring.current;
    const l = label.current;
    if (!d || !r || !l) return detach;

    document.documentElement.classList.add('has-cursor');
    const reduced = prefersReducedMotion();
    const dx = gsap.quickTo(d, 'x', { duration: 0.08, ease: 'power3.out' });
    const dy = gsap.quickTo(d, 'y', { duration: 0.08, ease: 'power3.out' });
    const rx = gsap.quickTo(r, 'x', { duration: reduced ? 0.08 : 0.42, ease: 'power3.out' });
    const ry = gsap.quickTo(r, 'y', { duration: reduced ? 0.08 : 0.42, ease: 'power3.out' });
    let shown = false;
    let mode = '';

    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (!shown) {
        shown = true;
        // Jump to the pointer (start = end) instead of gliding in from the corner.
        dx(e.clientX, e.clientX);
        dy(e.clientY, e.clientY);
        rx(e.clientX, e.clientX);
        ry(e.clientY, e.clientY);
        gsap.to([d, r], { opacity: 1, duration: 0.3 });
        return;
      }
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };

    const over = (e: PointerEvent) => {
      const t = e.target as Element | null;
      const labelled = t?.closest<HTMLElement>('[data-cursor]');
      const interactive = t?.closest('a, button, [role="button"], [role="slider"], input, select, summary, label');
      const next = labelled ? `label:${labelled.dataset.cursor}` : interactive ? 'link' : '';
      if (next === mode) return;
      mode = next;
      if (labelled) {
        l.textContent = labelled.dataset.cursor ?? '';
        gsap.to(r, { scale: 2.6, duration: 0.45, ease: 'expo.out' });
        gsap.to(l, { opacity: 1, duration: 0.2 });
        gsap.to(d, { scale: 0, duration: 0.2 });
      } else {
        gsap.to(l, { opacity: 0, duration: 0.15 });
        gsap.to(r, { scale: interactive ? 1.7 : 1, duration: 0.45, ease: 'expo.out' });
        gsap.to(d, { scale: interactive ? 0.5 : 1, duration: 0.2 });
      }
    };
    const down = () => gsap.to(r, { scale: '*=0.85', duration: 0.15 });
    const leave = () => {
      shown = false;
      gsap.to([d, r], { opacity: 0, duration: 0.2 });
    };

    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', over, { passive: true });
    window.addEventListener('pointerdown', down, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      detach();
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      window.removeEventListener('pointerdown', down);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <div aria-hidden="true" data-chrome className="pointer-events-none fixed top-0 left-0 z-[100] hidden [@media(hover:hover)_and_(pointer:fine)]:block">
      <div ref={ring} className="absolute top-0 left-0 opacity-0">
        <div className="absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-fg/60">
          <span ref={label} className="font-mono text-[5px] tracking-wider text-fg uppercase opacity-0" />
        </div>
      </div>
      <div ref={dot} className="absolute top-0 left-0 opacity-0">
        <div className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
      </div>
    </div>
  );
}
