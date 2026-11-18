'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { blendSignal } from '@/lib/signal';
import { easeInOut } from '@/lib/fit';
import { getLenis } from '@/lib/scroll';
import { clamp } from '@/lib/utils';
import { TransitionLink } from '@/components/transition/TransitionLink';
import { Poster } from '@/components/poster/Poster';
import { Caption } from '@/components/ui/Copy';
import { home } from '@/content/home';
import { OWNER, stops } from './signal';

export type FeaturedCase = { slug: string; no: string; title: string; kindLabel: string; kicker: string; tint: string };

const f = home.featured;
const PINNED = '(min-width: 1024px) and (hover: hover) and (prefers-reduced-motion: no-preference)';

/**
 * 5. Featured work. On desktop the track is pinned and scrubbed sideways by vertical scroll
 * (drag and arrow keys work too). On touch, and under reduced motion, it is a native
 * horizontal scroller with snap points. Each card hands its title and poster to the case study.
 */
export function Featured({ cases }: { cases: FeaturedCase[] }) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const scene = ref.current;
      if (!scene) return;
      const pin = scene.querySelector<HTMLElement>('.featured-pin')!;
      const track = scene.querySelector<HTMLElement>('.featured-track')!;
      const bar = scene.querySelector<HTMLElement>('[data-progress]');
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        ScrollTrigger.create({
          trigger: scene,
          start: 'top bottom',
          end: 'top 25%',
          onUpdate: (self) => blendSignal(OWNER, stops.act, stops.featured, easeInOut(self.progress)),
        });
      });

      mm.add(PINNED, () => {
        const dist = () => Math.max(0, track.offsetWidth - pin.clientWidth);
        const tween = gsap.to(track, {
          x: () => -dist(),
          ease: 'none',
          scrollTrigger: {
            trigger: scene,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (bar) bar.style.transform = `scaleX(${self.progress.toFixed(4)})`;
            },
          },
        });
        const st = tween.scrollTrigger!;
        const scrollTo = (y: number, immediate: boolean) => {
          const lenis = getLenis();
          if (lenis) lenis.scrollTo(y, { immediate, duration: 0.9 });
          else window.scrollTo({ top: y });
        };

        // Keyboard: focusing a card brings it into place.
        const onFocus = (e: FocusEvent) => {
          const target = e.target as HTMLElement;
          const card = target.closest<HTMLElement>('li');
          const d = dist();
          if (!card || !d || !target.matches(':focus-visible')) return;
          const p = clamp((card.offsetLeft - track.firstElementChild!.getBoundingClientRect().width * 0.2) / d);
          scrollTo(st.start + p * (st.end - st.start), false);
        };
        const onKey = (e: KeyboardEvent) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          const links = Array.from(track.querySelectorAll<HTMLElement>('a'));
          const i = links.indexOf(document.activeElement as HTMLElement);
          const next = links[i + (e.key === 'ArrowRight' ? 1 : -1)];
          if (i < 0 || !next) return;
          e.preventDefault();
          next.focus();
        };

        // Drag sideways to scrub.
        let down = false;
        let moved = false;
        let x0 = 0;
        let y0 = 0;
        const onDown = (e: PointerEvent) => {
          if (e.pointerType !== 'mouse' || e.button !== 0) return;
          down = true;
          moved = false;
          x0 = e.clientX;
          y0 = window.scrollY;
        };
        const onMove = (e: PointerEvent) => {
          if (!down) return;
          const dx = e.clientX - x0;
          if (Math.abs(dx) > 6) moved = true;
          if (!moved) return;
          const ratio = (st.end - st.start) / Math.max(1, dist());
          scrollTo(clamp(y0 - dx * ratio, st.start, st.end), true);
        };
        const onUp = () => {
          down = false;
        };
        const onClick = (e: MouseEvent) => {
          if (!moved) return;
          moved = false;
          e.preventDefault();
          e.stopPropagation();
        };

        track.addEventListener('focusin', onFocus);
        track.addEventListener('keydown', onKey);
        track.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        track.addEventListener('click', onClick, true);
        return () => {
          track.removeEventListener('focusin', onFocus);
          track.removeEventListener('keydown', onKey);
          track.removeEventListener('pointerdown', onDown);
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          track.removeEventListener('click', onClick, true);
        };
      });
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref}
      className="featured"
      style={{ '--len': 1 + cases.length * 0.42 } as React.CSSProperties}
      data-chapter="Work"
      aria-labelledby="featured-title"
    >
      <div className="featured-pin flex flex-col pt-[calc(var(--bar-h)+1vh)] pb-[3vh]">
        <header className="wrap grid-12 items-end gap-y-3">
          <div className="col-span-12 lg:col-span-8">
            <Caption>{f.eyebrow}</Caption>
            <h2 id="featured-title" className="text-display-sm mt-2 max-w-[22ch]">
              {f.heading}
            </h2>
          </div>
          <div className="col-span-12 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 lg:col-span-4 lg:flex-col lg:items-end">
            <p className="text-caption">{`// ${f.hint.toLowerCase()}`}</p>
            <TransitionLink href={f.all.href} className="text-label link whitespace-nowrap">
              {f.all.label}
            </TransitionLink>
          </div>
        </header>

        <div className="featured-scroller mt-[3vh] min-h-0 flex-1">
          <ol className="featured-track">
            {cases.map((c) => (
              <li key={c.slug} className="featured-card">
                <TransitionLink
                  href={`/work/${c.slug}`}
                  shared={c.slug}
                  draggable={false}
                  data-poster-host=""
                  data-cursor="Open"
                  className="group block"
                >
                  <Poster slug={c.slug} tint={c.tint} className="aspect-[4/5] w-full border border-line" />
                  <span className="text-label mt-4 flex justify-between gap-4 text-mute">
                    <span className="tnum">{c.no}</span>
                    <span>{c.kindLabel}</span>
                  </span>
                  <span data-shared-title className="text-title mt-2 block">
                    {c.title}
                  </span>
                  <span className="text-small mt-1 block text-mute">{c.kicker}</span>
                </TransitionLink>
              </li>
            ))}
          </ol>
        </div>

        <div className="wrap mt-[2vh] flex min-w-0 items-center gap-6">
          <div aria-hidden="true" className="featured-bar relative h-px min-w-0 flex-1 bg-line">
            <div data-progress className="absolute inset-0 origin-left bg-accent" style={{ transform: 'scaleX(0)' }} />
          </div>
          <Caption className="hidden flex-none md:block">{f.caption}</Caption>
        </div>
      </div>
    </section>
  );
}
