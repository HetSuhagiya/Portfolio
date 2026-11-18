'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { blendSignal, SIGNAL_COLOR } from '@/lib/signal';
import { easeInOut, fitLayout, fitted, seg } from '@/lib/fit';
import { prefersReducedMotion } from '@/lib/utils';
import type { SignalPreset } from '@/content/types';
import { home } from '@/content/home';
import { OWNER, stops } from './signal';
import { SceneHead } from './SceneHead';

const a = home.act;

/** Synthetic shapes for the three mini charts. */
const BARS = [14, 19, 16, 23, 21, 27, 25, 33];
const TREND = 'M2 34 L18 30 L34 32 L50 24 L66 26 L82 17 L98 14 L118 6';
const INSIGHT = 'M2 30 L22 31 L42 27 L62 28 L82 20 L98 12 L118 9';

/**
 * 4. Act. The ordered grid blooms into a chart, three dashboard tiles draw themselves,
 * and the signal turns amber: the one place on the page where a decision is made.
 */
export function Act() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const scene = ref.current;
      if (!scene || prefersReducedMotion()) return;
      const pin = scene.querySelector<HTMLElement>('.scene-pin')!;
      const win = scene.querySelector<HTMLElement>('[data-window]')!;
      let flat: SignalPreset = stops.act;
      let bloom: SignalPreset = stops.act;

      const place = () => {
        const fit = fitLayout('bars', win, pin, 8);
        const base = { layout: 'bars', color: SIGNAL_COLOR, turbulence: 0.04, flow: 0.2, spread: 0.3 } as const;
        flat = fitted({ ...base, param: 0, accent: 0, intensity: 1.6 }, fit);
        bloom = fitted({ ...base, param: 1, accent: 0, intensity: 2.4 }, fit);
        stops.act = fitted({ ...base, param: 1, accent: 1, intensity: 2.8 }, fit);
      };
      place();
      ScrollTrigger.addEventListener('refreshInit', place);

      ScrollTrigger.create({
        trigger: scene,
        start: 'top bottom',
        end: 'top top',
        onUpdate: (self) => blendSignal(OWNER, stops.own, flat, easeInOut(self.progress)),
      });

      gsap
        .timeline({
          defaults: { ease: 'none', overwrite: false },
          scrollTrigger: {
            trigger: scene,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            onUpdate: (self) => {
              const p = self.progress;
              if (p < 0.5) blendSignal(OWNER, flat, bloom, easeInOut(seg(p, 0.04, 0.44)));
              else blendSignal(OWNER, bloom, stops.act, easeInOut(seg(p, 0.52, 0.84)));
            },
          },
        })
        .from('[data-tile]', { opacity: 0, y: 20, duration: 0.12, stagger: 0.05 }, 0.06)
        .from('[data-bar]', { scaleY: 0, duration: 0.2, stagger: 0.012, ease: 'power2.out' }, 0.16)
        .from('[data-draw]', { strokeDashoffset: 1, duration: 0.3, stagger: 0.08 }, 0.24)
        .from('[data-mark]', { scale: 0, opacity: 0, duration: 0.08, ease: 'back.out(2)' }, 0.62)
        .from('[data-decision]', { yPercent: 110, duration: 0.14, ease: 'power3.out' }, 0.76)
        .from('[data-cap]', { opacity: 0, duration: 0.08 }, 0.84)
        .to({}, { duration: 0.01 }, 0.99);

      return () => ScrollTrigger.removeEventListener('refreshInit', place);
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="scene" style={{ '--len': 2.5 } as React.CSSProperties} data-chapter="Act" aria-labelledby="act-title">
      <div className="scene-pin flex flex-col pt-[calc(var(--bar-h)+1vh)] pb-[4vh]">
        <SceneHead id="act-title" no={a.no} title={a.title} body={a.body} />

        <div className="wrap grid-12 min-h-0 flex-1 items-stretch gap-y-4 py-[3vh]">
          <div data-window className="relative col-span-12 min-h-[8rem] md:order-2 md:col-span-7 md:col-start-6">
            <svg className="gl-alt absolute inset-0 h-full w-full" viewBox="0 0 420 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
              {BARS.map((h, i) => (
                <rect key={i} x={20 + i * 48} y={200 - h * 5.4} width={34} height={h * 5.4} fill={i === BARS.length - 1 ? 'var(--decide)' : 'var(--accent)'} fillOpacity={0.85} />
              ))}
              <line x1="10" y1="200.5" x2="410" y2="200.5" stroke="var(--line-strong)" />
            </svg>
          </div>

          <ul aria-label="What the dashboards show" className="col-span-12 grid grid-cols-3 content-center gap-3 md:order-1 md:col-span-4 md:grid-cols-1">
            {a.tiles.map((t, i) => (
              <li key={t} data-tile className="panel flex flex-col justify-between gap-2 p-3 md:flex-row md:items-center md:gap-6 md:p-4">
                <span className="text-label text-mute">{t}</span>
                <svg viewBox="0 0 120 40" className="h-8 w-full md:h-10 md:w-32 md:flex-none" aria-hidden="true" focusable="false">
                  {i === 0 &&
                    BARS.map((h, j) => (
                      <rect key={j} data-bar x={2 + j * 15} y={38 - h} width={10} height={h} fill="var(--fg)" fillOpacity={0.8} style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }} />
                    ))}
                  {i === 1 && <path data-draw d={TREND} pathLength={1} strokeDasharray="1 1" fill="none" stroke="var(--fg)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />}
                  {i === 2 && (
                    <>
                      <line x1="0" y1="22" x2="120" y2="22" stroke="var(--line-strong)" strokeDasharray="3 3" />
                      <path data-draw d={INSIGHT} pathLength={1} strokeDasharray="1 1" fill="none" stroke="var(--fg)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
                      <circle data-mark cx="78" cy="22" r="4" fill="var(--decide)" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
                    </>
                  )}
                </svg>
              </li>
            ))}
          </ul>
        </div>

        <div className="wrap flex flex-wrap items-end justify-between gap-x-10 gap-y-2">
          <p className="text-display-sm overflow-clip text-decide">
            <span data-decision className="block">
              {a.decision}
            </span>
          </p>
          <div data-cap className="text-right">
            <p className="text-caption">{a.caption}</p>
            <p className="text-caption">{`// ${a.note.toLowerCase()}`}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
