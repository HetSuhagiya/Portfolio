'use client';

import { useRef } from 'react';
import { gsap, useGSAP, EASE } from '@/lib/gsap';
import { formatInt, prefersReducedMotion } from '@/lib/utils';

type Props = {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
};

/**
 * Counts up when scrolled into view. Only ever used for numbers that are facts on the CV.
 * The final value is in the server HTML, so it is readable without JS and by screen readers.
 */
export function Counter({ value, prefix = '', suffix = '', className, duration = 1.4 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const label = `${prefix}${formatInt(value)}${suffix}`;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const num = el.querySelector<HTMLElement>('[data-n]');
      if (!num) return;
      const o = { v: 0 };
      num.textContent = '0';
      gsap.to(o, {
        v: value,
        duration,
        ease: EASE.out,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate: () => {
          num.textContent = formatInt(o.v);
        },
      });
    },
    { scope: ref, dependencies: [value] },
  );

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">
        {prefix}
        <span data-n>{formatInt(value)}</span>
        {suffix}
      </span>
    </span>
  );
}
