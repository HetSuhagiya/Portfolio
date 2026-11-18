'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { totalProgress, useApp } from '@/lib/store';
import { prefersReducedMotion } from '@/lib/utils';
import { site } from '@/content/site';
import { home } from '@/content/home';
import { SEEN_KEY } from '@/lib/preload';

const MIN_MS = 1200;
const MAX_MS = 3800;

/**
 * Preload: noise sharpens into the name while real progress is measured
 * (hydration, fonts, the WebGL bundle, the first rendered frame).
 *
 * The overlay is in the server HTML, so the name is the first paint. An inline script in the
 * root layout sets html[data-seen] for repeat visits, which hides the overlay before first paint.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const name = useRef<HTMLParagraphElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const noise = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const app = useApp.getState();
    const skip = document.documentElement.hasAttribute('data-seen');
    if (!el || skip) {
      app.setPreloaded();
      return;
    }

    const reduced = prefersReducedMotion();
    if (reduced && name.current) {
      name.current.style.filter = 'none';
      name.current.style.opacity = '1';
      name.current.style.letterSpacing = '';
    }
    const start = performance.now();
    const shown = { v: 0 };
    let done = false;
    document.documentElement.style.overflow = 'hidden';

    const finish = () => {
      if (done) return;
      done = true;
      gsap.ticker.remove(tick);
      try {
        localStorage.setItem(SEEN_KEY, String(Date.now()));
      } catch {
        /* private mode */
      }
      document.documentElement.style.overflow = '';
      const tl = gsap.timeline({
        onComplete: () => {
          el.style.display = 'none';
        },
      });
      tl.to(el.querySelectorAll('[data-pre-out]'), { opacity: 0, duration: 0.3, ease: 'none' })
        .add(() => useApp.getState().setPreloaded(), reduced ? 0 : 0.15)
        .to(el, { opacity: 0, duration: reduced ? 0.2 : 0.7, ease: 'power2.inOut' }, reduced ? 0 : 0.1);
    };

    const tick = () => {
      const elapsed = performance.now() - start;
      const real = totalProgress(useApp.getState().progress);
      // Never ahead of real progress, never faster than the minimum duration.
      const target = Math.min(real, elapsed / MIN_MS);
      shown.v += (target - shown.v) * 0.14;
      const p = elapsed > MAX_MS ? 1 : shown.v;
      if (count.current) count.current.textContent = String(Math.round(p * 100)).padStart(3, '0');
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      if (name.current && !reduced) {
        // Noise sharpens into the name.
        name.current.style.filter = `blur(${((1 - p) * 14).toFixed(2)}px)`;
        name.current.style.opacity = String(0.35 + 0.65 * p);
        name.current.style.letterSpacing = `${(0.12 * (1 - p) - 0.035).toFixed(4)}em`;
      }
      if (noise.current) noise.current.style.opacity = String(0.5 * (1 - p));
      if (p > 0.992 || elapsed > MAX_MS) finish();
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div
      ref={root}
      id="preloader"
      data-chrome
      className="bg-ink text-paper fixed inset-0 z-[90] flex flex-col justify-between px-(--gutter) py-6"
      role="status"
      aria-label="Loading"
    >
      <div ref={noise} aria-hidden="true" className="grain pointer-events-none" style={{ opacity: 0.5 }} />
      <p data-pre-out className="text-caption relative">
        {home.preload.caption}
      </p>
      <p
        ref={name}
        className="text-display-xl relative text-center"
        style={{
          filter: 'blur(14px)',
          opacity: 0.35,
          letterSpacing: '0.085em',
          willChange: 'filter, opacity',
        }}
      >
        {site.name}
      </p>
      <div data-pre-out className="relative flex items-end justify-between gap-6">
        <div className="h-px flex-1 bg-white/15">
          <div ref={bar} className="bg-signal h-full origin-left" style={{ transform: 'scaleX(0)' }} />
        </div>
        <span ref={count} className="text-label tnum" aria-hidden="true">
          000
        </span>
      </div>
    </div>
  );
}
