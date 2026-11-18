'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useMedia, useReducedMotion } from '@/hooks/useMedia';
import { prng } from '@/lib/utils';
import type { CaseStudy } from '@/content/types';

type Props = { mess: CaseStudy['challenge']['mess']; caption: string };
type Size = { w: number; h: number };

/**
 * "The challenge", shown instead of described: a pile of fragments that can be dragged around,
 * and one button that files them into order. Works with the keyboard (the button) and without motion.
 */
export function Mess({ mess, caption }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const chips = useRef<(HTMLLIElement | null)[]>([]);
  const [ordered, setOrdered] = useState(false);
  const [boxSize, setBoxSize] = useState<Size | null>(null);
  const [sizes, setSizes] = useState<Size[]>([]);
  const reduced = useReducedMotion();
  const wide = useMedia('(min-width: 768px)');

  // Deterministic scatter: the same mess on every visit.
  const scatter = useMemo(() => {
    const r = prng(mess.fragments.length * 131 + mess.fragments[0]!.length);
    return mess.fragments.map(() => ({ x: r(), y: r(), rot: Math.round((r() - 0.5) * 18) }));
  }, [mess]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      setBoxSize({ w: el.clientWidth, h: el.clientHeight });
      setSizes(chips.current.map((c) => ({ w: c?.offsetWidth ?? 0, h: c?.offsetHeight ?? 0 })));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    document.fonts.ready.then(measure);
    return () => ro.disconnect();
  }, []);

  const ready = boxSize !== null && sizes.length === mess.fragments.length;

  // Filed positions: a tidy wrapped row, top-left.
  const filed = useMemo(() => {
    if (!ready) return [];
    const maxW = wide ? boxSize.w * 0.46 : boxSize.w;
    let x = 0;
    let y = 0;
    return sizes.map((s) => {
      if (x > 0 && x + s.w > maxW) {
        x = 0;
        y += s.h + 8;
      }
      const pos = { x, y };
      x += s.w + 8;
      return pos;
    });
  }, [ready, sizes, boxSize, wide]);

  const spring = reduced ? { duration: 0 } : { type: 'spring' as const, stiffness: 170, damping: 22, mass: 0.9 };

  return (
    <div className="panel p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p className="text-caption" aria-live="polite">
          {ordered ? mess.orderLabel : mess.chaosLabel}
        </p>
        <button type="button" className="btn btn-sm" aria-pressed={ordered} onClick={() => setOrdered((v) => !v)}>
          {ordered ? 'Scatter again' : 'Resolve it'}
          <span aria-hidden="true">{ordered ? '↺' : '→'}</span>
        </button>
      </div>

      <div ref={box} className="relative mt-5 h-[26rem] touch-pan-y md:h-[20rem]">
        <ul aria-label="The problem, in fragments" className={ready ? '' : 'flex flex-wrap gap-2'}>
          {mess.fragments.map((frag, i) => {
            const s = sizes[i];
            const sc = scatter[i]!;
            const target =
              ready && s
                ? ordered
                  ? { x: filed[i]!.x, y: filed[i]!.y, rotate: 0, opacity: 0.5 }
                  : {
                      x: sc.x * Math.max(0, boxSize.w - s.w),
                      y: sc.y * Math.max(0, boxSize.h - s.h - 8),
                      rotate: sc.rot,
                      opacity: 1,
                    }
                : undefined;
            return (
              <motion.li
                key={frag + i}
                ref={(el) => {
                  chips.current[i] = el;
                }}
                className={`chip mess-chip !text-fg ${ready ? 'absolute top-0 left-0' : ''}`}
                data-cursor={ordered ? undefined : 'Drag'}
                initial={false}
                animate={target}
                transition={{ ...spring, delay: reduced ? 0 : i * 0.018 }}
                drag={ready && !ordered}
                dragConstraints={box}
                dragElastic={0.12}
                dragTransition={{ power: 0.15, timeConstant: 180 }}
                whileDrag={{ scale: 1.06, zIndex: 5 }}
              >
                {frag}
              </motion.li>
            );
          })}
        </ul>

        <ol
          aria-label="Resolved into"
          aria-hidden={!ordered}
          className="pointer-events-none absolute inset-x-0 bottom-0 md:inset-y-0 md:right-0 md:left-auto md:flex md:w-1/2 md:flex-col md:justify-center"
        >
          {mess.resolved.map((r, i) => (
            <motion.li
              key={r}
              className="flex items-baseline gap-4 border-t border-line py-2.5 last:border-b"
              initial={false}
              animate={{ opacity: ordered ? 1 : 0, x: ordered || reduced ? 0 : 24 }}
              transition={reduced ? { duration: 0 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: ordered ? 0.15 + i * 0.07 : 0 }}
            >
              <span className="text-label tnum text-accent">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-title">{r}</span>
            </motion.li>
          ))}
        </ol>
      </div>

      <p className="text-caption mt-4">{caption}</p>
    </div>
  );
}
