'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollTrigger, useGSAP } from '@/lib/gsap';
import { scrollToTarget } from '@/lib/scroll';
import { useMedia } from '@/hooks/useMedia';
import { cn } from '@/lib/utils';
import { Caption, DemoLabel } from '@/components/ui/Copy';
import type { CaseStudy } from '@/content/types';
import { ModuleHost } from './ModuleHost';
import { PIN_QUERY } from './modules/types';

/**
 * "The approach": the page's signature module beside a rail of chapters.
 * Desktop: the section pins, scroll moves through the chapters and the rail fills.
 * Touch / reduced motion: nothing pins; the chapters are buttons.
 */
export function Approach({ approach }: { approach: CaseStudy['approach'] }) {
  const ref = useRef<HTMLElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const pinned = useMedia(PIN_QUERY);
  const [step, setStep] = useState(0);
  const n = approach.chapters.length;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !pinned) return;
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          if (fill.current) fill.current.style.transform = `scaleY(${self.progress.toFixed(4)})`;
          const i = Math.min(n - 1, Math.floor(self.progress * n * 0.9999));
          setStep((prev) => (prev === i ? prev : i));
        },
      });
      trigger.current = st;
      return () => {
        st.kill();
        trigger.current = null;
      };
    },
    { dependencies: [pinned, n] },
  );

  // Without the pin, the rail simply shows how far through the chapters the reader is.
  useEffect(() => {
    if (!pinned && fill.current) fill.current.style.transform = `scaleY(${(step + 1) / n})`;
  }, [pinned, step, n]);

  const goTo = useCallback(
    (i: number) => {
      const st = trigger.current;
      const next = Math.max(0, Math.min(n - 1, i));
      if (pinned && st) scrollToTarget(st.start + ((next + 0.5) / n) * (st.end - st.start));
      else setStep(next);
    },
    [pinned, n],
  );

  const active = approach.chapters[step]!;

  return (
    <section ref={ref} className="approach" style={{ '--len': n + 1.2 } as React.CSSProperties} data-chapter="Approach" aria-labelledby="approach-title">
      <div className="approach-pin">
        <div className="wrap grid-12 h-full gap-y-6 pt-[calc(var(--bar-h)+0.5rem)] pb-5">
          <div className="col-span-12 flex min-h-0 flex-col lg:col-span-3">
            <Caption>{'// 03 · the approach'}</Caption>
            <h2 id="approach-title" className="text-display-sm mt-2">
              {approach.heading}
            </h2>
            <p className="text-small mt-3 text-mute">{approach.intro}</p>

            <div className="relative mt-6">
              <div aria-hidden="true" className="absolute top-0 bottom-0 left-0 w-px bg-line">
                <div ref={fill} className="absolute inset-0 origin-top bg-accent" style={{ transform: 'scaleY(0)' }} />
              </div>
              <ol className="approach-chapters">
                {approach.chapters.map((ch, i) => (
                  <li key={ch.title}>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-current={i === step ? 'step' : undefined}
                      className={cn(
                        'flex min-h-11 w-full items-baseline gap-3 py-2 pl-5 text-left transition-colors duration-300',
                        i === step ? 'text-fg' : 'text-mute hover:text-fg',
                      )}
                    >
                      <span className="text-label tnum">{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-body">{ch.title}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <p key={step} className="approach-body text-small mt-4 min-h-[4.5rem] border-t border-line pt-4" aria-live="polite">
              {active.body}
            </p>

            <div className="mt-auto hidden pt-4 lg:block">
              <DemoLabel />
            </div>
          </div>

          <div className="col-span-12 flex min-h-0 flex-col lg:col-span-9">
            <ModuleHost id={approach.module} title={approach.moduleTitle} alt={approach.alt} step={step} steps={n} pinned={pinned} goTo={goTo} />
            {/* When pinned, this row is as tall as the fixed CV / Contact dock and keeps clear of it,
                so the dock sits beside the caption instead of over the demo. */}
            <div className={cn('mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-1', pinned && 'min-h-11 pr-72')}>
              <Caption>{approach.caption}</Caption>
              <div className="lg:hidden">
                <DemoLabel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
