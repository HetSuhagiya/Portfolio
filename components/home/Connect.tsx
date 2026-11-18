'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { blendSignal, SIGNAL_COLOR } from '@/lib/signal';
import { easeInOut, fitLayout, fitted, seg } from '@/lib/fit';
import { prefersReducedMotion } from '@/lib/utils';
import { Counter } from '@/components/motion/Counter';
import type { SignalPreset } from '@/content/types';
import { home } from '@/content/home';
import { OWNER, stops } from './signal';
import { SceneHead } from './SceneHead';

const c = home.connect;
const K = c.sources.length;
/** Rows of the static illustration (and of the particle layout): evenly spaced sources. */
const ROWS = c.sources.map((_, i) => 40 + (i * 220) / (K - 1));

/**
 * 2. Connect. Five sources enter as separate, restless streams and merge into one.
 * The particles are the illustration; the labels are real text placed on the source nodes.
 */
export function Connect() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const scene = ref.current;
      if (!scene || prefersReducedMotion()) return;
      const pin = scene.querySelector<HTMLElement>('.scene-pin')!;
      const win = scene.querySelector<HTMLElement>('[data-window]')!;
      const labels = gsap.utils.toArray<HTMLElement>('[data-source]', scene);
      let raw: SignalPreset = stops.connect;

      const place = () => {
        const fit = fitLayout('merge', win, pin);
        raw = fitted({ layout: 'merge', color: SIGNAL_COLOR, param: 0, turbulence: 0.2, flow: 0.4, spread: 0.6, intensity: 1.7 }, fit);
        stops.connect = fitted({ layout: 'merge', color: SIGNAL_COLOR, param: 1, turbulence: 0.07, flow: 0.45, spread: 0.4, intensity: 1.25 }, fit);
        labels.forEach((el, i) => {
          // Source i sits at a fixed point of the "merge" layout (see SIM_FRAG, layout 3).
          const [x, y] = fit.point(-0.9, (((K - 1 - i + 0.5) / K) * 2 - 1) * 0.62);
          gsap.set(el, { x: x - 12, y: y - 26, yPercent: -100 });
        });
      };
      place();
      ScrollTrigger.addEventListener('refreshInit', place);

      ScrollTrigger.create({
        trigger: scene,
        start: 'top bottom',
        end: 'top top',
        onUpdate: (self) => blendSignal(OWNER, stops.hero, raw, easeInOut(self.progress)),
      });

      gsap
        .timeline({
          defaults: { ease: 'none', overwrite: false },
          scrollTrigger: {
            trigger: scene,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            onUpdate: (self) => blendSignal(OWNER, raw, stops.connect, easeInOut(seg(self.progress, 0.16, 0.74))),
          },
        })
        .from(labels, { opacity: 0, duration: 0.1, stagger: 0.025 }, 0)
        .to('[data-cap-start]', { opacity: 0, duration: 0.07 }, 0.52)
        .fromTo('[data-cap-end]', { opacity: 0 }, { opacity: 1, duration: 0.07 }, 0.6)
        .to(labels, { opacity: 0.5, duration: 0.1 }, 0.66)
        .to({}, { duration: 0.01 }, 0.99);

      return () => ScrollTrigger.removeEventListener('refreshInit', place);
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="scene" style={{ '--len': 2.3 } as React.CSSProperties} data-chapter="Connect" aria-labelledby="connect-title">
      <div className="scene-pin flex flex-col pt-[calc(var(--bar-h)+1vh)] pb-[4vh]">
        <SceneHead id="connect-title" no={c.no} title={c.title} body={c.body} />

        <div data-window className="relative min-h-[15rem] flex-1">
          {/* Real text: the sources, placed on the particle nodes when the canvas is running. */}
          <ul className="scene-labels" aria-label="Data sources">
            {c.sources.map((s) => (
              <li key={s} data-source className="text-label whitespace-nowrap">
                {s}
              </li>
            ))}
          </ul>
          {/* Static illustration: shown without WebGL and under reduced motion. */}
          <svg className="gl-alt absolute inset-0 h-full w-full" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
            {ROWS.map((y, i) => (
              <g key={i}>
                <path
                  d={`M70 ${y} C 260 ${y}, 300 150, 470 150 L 800 150`}
                  fill="none"
                  stroke="var(--accent)"
                  strokeOpacity={0.55}
                  strokeWidth={1.5}
                />
                <circle cx={70} cy={y} r={7} fill="none" stroke="var(--accent)" strokeWidth={1.5} />
                <text x={88} y={y - 10} fill="var(--fg)" fontSize={11} fontFamily="var(--font-mono)" letterSpacing="0.08em">
                  {c.sources[i]!.toUpperCase()}
                </text>
              </g>
            ))}
            <path d="M470 150 L 800 150" stroke="var(--accent)" strokeWidth={3} />
          </svg>
        </div>

        <div className="wrap flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <p className="flex items-baseline gap-4">
            <Counter value={c.counter.value} suffix={c.counter.suffix} className="text-display-md text-accent" />
            <span className="text-label text-mute">{c.counter.label}</span>
          </p>
          <div className="relative grid text-right">
            <p data-cap-start className="text-caption [grid-area:1/1]">
              {c.captionStart}
            </p>
            <p data-cap-end className="text-caption [grid-area:1/1]">
              {c.captionEnd}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
