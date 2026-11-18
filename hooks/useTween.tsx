'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { formatInt, prefersReducedMotion } from '@/lib/utils';
import { useReducedMotion } from './useMedia';

/**
 * A number that tweens to its new value. It writes straight to the DOM (no React re-render per frame).
 * Used by every interactive module, so values never snap.
 */
export function Num({
  value,
  format = formatInt,
  duration = 0.6,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const cur = useRef(value);
  const fmt = useRef(format);
  // The text React renders never changes after mount; the tween owns it from then on.
  const [initial] = useState(() => format(value));

  // Keep the latest formatter for the tween, and repaint if only the formatter changed (a unit switch, say).
  useEffect(() => {
    fmt.current = format;
    if (ref.current) ref.current.textContent = format(cur.current);
  }, [format]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || duration === 0) {
      cur.current = value;
      el.textContent = fmt.current(value);
      return;
    }
    const o = { v: cur.current };
    const tween = gsap.to(o, {
      v: value,
      duration,
      ease: 'power3.out',
      overwrite: false,
      onUpdate: () => {
        cur.current = o.v;
        el.textContent = fmt.current(o.v);
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, duration]);


  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {initial}
    </span>
  );
}

/** Linear resample, so a series can morph into one with a different number of points. */
function resample(values: number[], n: number): number[] {
  if (values.length === n) return values;
  if (values.length === 0) return new Array<number>(n).fill(0);
  if (values.length === 1 || n === 1) return new Array<number>(n).fill(values[0]!);
  return Array.from({ length: n }, (_, i) => {
    const p = (i / (n - 1)) * (values.length - 1);
    const a = Math.floor(p);
    const b = Math.min(values.length - 1, a + 1);
    return values[a]! + (values[b]! - values[a]!) * (p - a);
  });
}

/**
 * Tween an array of numbers (for example the points of a line) and re-render while it moves.
 * When the length changes (daily to weekly, say) the old shape is resampled first, so it still morphs.
 */
export function useTweenedArray(target: number[], duration = 0.6): number[] {
  const [values, setValues] = useState(target);
  const cur = useRef(target);
  const reduced = useReducedMotion();
  const key = target.join(',');

  useEffect(() => {
    if (reduced) {
      cur.current = target;
      return;
    }
    const from = resample(cur.current, target.length);
    // Nothing to move (first mount, or the same data again): skip the tween and its re-renders.
    if (from.every((v, i) => v === target[i])) {
      cur.current = target;
      return;
    }
    const o = { t: 0 };
    const tween = gsap.to(o, {
      t: 1,
      duration,
      ease: 'power3.out',
      overwrite: false,
      onUpdate: () => {
        const next = target.map((v, i) => from[i]! + (v - from[i]!) * o.t);
        cur.current = next;
        setValues(next);
      },
    });
    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, duration, reduced]);

  // With reduced motion there is no tween: the target is simply what is shown.
  return reduced ? target : values;
}
