'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { blendSignal, SIGNAL_COLOR } from '@/lib/signal';
import { easeInOut, fitLayout, fitted, seg } from '@/lib/fit';
import { formatGBP, formatInt, lerp, prefersReducedMotion } from '@/lib/utils';
import type { SignalPreset } from '@/content/types';
import { home } from '@/content/home';
import { OWNER, stops } from './signal';
import { SceneHead } from './SceneHead';

const o = home.own;

/** Synthetic, illustrative values. `report` is what the BI report shows before reconciliation. */
const DATA = [
  { source: 48210, report: 41960, money: false },
  { source: 1284, report: 1412, money: false },
  { source: 86400, report: 78950, money: true },
  { source: 12300, report: 14020, money: true },
] as const;

const SCALE = 0.8;
const fmt = (v: number, money: boolean) => (money ? formatGBP(Math.round(v)) : formatInt(v));

/**
 * 3. Own. Scattered particles snap into an ordered grid; four metrics where source and report
 * disagree are reconciled until they match.
 */
export function Own() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const scene = ref.current;
      if (!scene || prefersReducedMotion()) return;
      const pin = scene.querySelector<HTMLElement>('.scene-pin')!;
      const win = scene.querySelector<HTMLElement>('[data-window]')!;
      const rows = gsap.utils.toArray<HTMLElement>('[data-row]', scene).map((row) => ({
        row,
        bar: row.querySelector<HTMLElement>('[data-bar]')!,
        val: row.querySelector<HTMLElement>('[data-val]')!,
        delta: row.querySelector<HTMLElement>('[data-delta]')!,
      }));
      let scatter: SignalPreset = stops.own;

      const place = () => {
        scatter = fitted(
          { layout: 'noise', color: SIGNAL_COLOR, turbulence: 0.9, flow: 0.2, intensity: 1.3 },
          fitLayout('noise', win, pin),
        );
        stops.own = fitted(
          { layout: 'grid', color: SIGNAL_COLOR, turbulence: 0.02, flow: 0.2, spread: 0.3, intensity: 2 },
          fitLayout('grid', win, pin, 8),
        );
      };
      place();
      ScrollTrigger.addEventListener('refreshInit', place);

      // Reconciliation, driven by one number k (0 = as found, 1 = reconciled).
      const state = { k: 0 };
      let last = -1;
      const render = () => {
        if (state.k === last) return;
        last = state.k;
        rows.forEach((r, i) => {
          const d = DATA[i]!;
          const t = easeInOut(seg(state.k, i * 0.17, i * 0.17 + 0.46));
          const v = lerp(d.report, d.source, t);
          const diff = (v - d.source) / d.source;
          const ok = t >= 1;
          r.bar.style.transform = `scaleX(${((v / d.source) * SCALE).toFixed(4)})`;
          r.val.textContent = fmt(v, d.money);
          r.delta.textContent = ok ? '✓ match' : `${diff > 0 ? '+' : '−'}${Math.abs(diff * 100).toFixed(1)}%`;
          if (ok !== r.row.hasAttribute('data-ok')) r.row.toggleAttribute('data-ok', ok);
        });
      };
      render();

      ScrollTrigger.create({
        trigger: scene,
        start: 'top bottom',
        end: 'top top',
        onUpdate: (self) => blendSignal(OWNER, stops.connect, scatter, easeInOut(self.progress)),
      });

      gsap
        .timeline({
          defaults: { ease: 'none', overwrite: false },
          scrollTrigger: {
            trigger: scene,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            onUpdate: (self) => blendSignal(OWNER, scatter, stops.own, easeInOut(seg(self.progress, 0.04, 0.4))),
          },
        })
        .from('[data-panel]', { opacity: 0, y: 24, duration: 0.14 }, 0.06)
        .to(state, { k: 1, duration: 0.5, onUpdate: render }, 0.36)
        .to('[data-cap-start]', { opacity: 0, duration: 0.06 }, 0.74)
        .fromTo('[data-cap-end]', { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.8)
        .to({}, { duration: 0.01 }, 0.99);

      return () => ScrollTrigger.removeEventListener('refreshInit', place);
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="scene" style={{ '--len': 2.5 } as React.CSSProperties} data-chapter="Own" aria-labelledby="own-title">
      <div className="scene-pin flex flex-col pt-[calc(var(--bar-h)+1vh)] pb-[4vh]">
        <SceneHead id="own-title" no={o.no} title={o.title} body={o.body} flip />

        <div className="wrap grid-12 min-h-0 flex-1 items-center gap-y-4 py-[3vh]">
          <div className="col-span-12 flex h-full min-h-[10rem] flex-col md:col-span-6">
            <div data-window className="relative min-h-[8rem] flex-1">
              <svg className="gl-alt absolute inset-0 h-full w-full" viewBox="0 0 420 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
                <defs>
                  <pattern id="own-grid" width="30" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="15" cy="10" r="2.2" fill="var(--accent)" />
                  </pattern>
                </defs>
                <rect width="420" height="220" fill="url(#own-grid)" />
              </svg>
            </div>
            <p className="text-caption mt-3">{o.caption}</p>
          </div>

          <div data-panel className="panel col-span-12 p-4 sm:p-6 md:col-span-5 md:col-start-8">
            <p className="sr-only">
              Illustration with synthetic values: four metrics (sessions, orders, revenue and ad spend) where the BI report
              first disagrees with the source platform, then matches it once reconciled.
            </p>
            <div aria-hidden="true">
              <div className="text-label flex flex-wrap items-center gap-x-5 gap-y-1 text-mute">
                <span className="flex items-center gap-2">
                  <span className="block h-0.5 w-4 bg-fg" />
                  {o.reconcile.sourceLabel}
                </span>
                <span className="flex items-center gap-2">
                  <span className="recon-key block h-0.5 w-4" />
                  {o.reconcile.reportLabel}
                </span>
              </div>
              <ul className="mt-3">
                {o.reconcile.rows.map((label, i) => {
                  const d = DATA[i]!;
                  return (
                    <li key={label} data-row data-ok="" className="recon-row grid grid-cols-[5.5rem_1fr_auto] items-center gap-x-4 border-t border-line py-2.5 sm:grid-cols-[6.5rem_1fr_auto_4.5rem]">
                      <span className="text-label text-mute">{label}</span>
                      <span className="relative block h-4">
                        <span className="absolute inset-x-0 top-0 block h-1 origin-left bg-fg" style={{ transform: `scaleX(${SCALE})` }} />
                        <span data-bar className="recon-bar absolute inset-x-0 bottom-0 block h-1 origin-left" style={{ transform: `scaleX(${SCALE})` }} />
                      </span>
                      <span data-val className="tnum min-w-[8ch] text-right font-mono text-sm">
                        {fmt(d.source, d.money)}
                      </span>
                      <span data-delta className="recon-delta tnum hidden text-right font-mono text-xs sm:block">
                        ✓ match
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-line pt-3">
                <div className="relative grid">
                  <p data-cap-start className="text-caption [grid-area:1/1]">
                    {o.reconcile.before}
                  </p>
                  <p data-cap-end className="text-caption [grid-area:1/1]">
                    {o.reconcile.after}
                  </p>
                </div>
                <p className="text-caption">{o.reconcile.note}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
