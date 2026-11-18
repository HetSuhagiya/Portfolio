'use client';

import { useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { gsap, SplitText, useGSAP, EASE } from '@/lib/gsap';
import { useApp } from '@/lib/store';
import { prefersReducedMotion } from '@/lib/utils';

type Props = {
  as?: ElementType;
  /** lines / chars: masked SplitText stagger. fade: opacity and a short rise. */
  type?: 'lines' | 'chars' | 'fade';
  /** Hero reveals play as soon as the page is ready (after the preloader or a route change). */
  hero?: boolean;
  delay?: number;
  stagger?: number;
  className?: string;
  style?: CSSProperties;
  id?: string;
  children: ReactNode;
} & Record<`data-${string}`, string | undefined>;

/**
 * Text reveal. Content is real HTML: SplitText keeps an aria-label on the element, and under
 * reduced motion (or without JS) the text is simply visible.
 */
export function Reveal({
  as,
  type = 'lines',
  hero = false,
  delay = 0,
  stagger,
  className,
  style,
  id,
  children,
  ...data
}: Props) {
  const Tag: ElementType = as ?? 'div';
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    (_, contextSafe) => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        gsap.set(el, { visibility: 'visible' });
        return;
      }

      const trigger = hero ? undefined : { trigger: el, start: 'top 90%', once: true };

      const play = contextSafe!(() => {
        gsap.set(el, { visibility: 'visible' });
        if (type === 'fade') {
          gsap.fromTo(
            el,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.9, ease: EASE.out, delay, scrollTrigger: trigger, clearProps: 'transform' },
          );
          return;
        }
        SplitText.create(el, {
          type: type === 'chars' ? 'chars' : 'lines',
          mask: type === 'chars' ? 'chars' : 'lines',
          linesClass: 'rl',
          charsClass: 'rc',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(type === 'chars' ? self.chars : self.lines, {
              yPercent: 112,
              duration: type === 'chars' ? 1.1 : 1,
              ease: EASE.out,
              stagger: stagger ?? (type === 'chars' ? 0.035 : 0.08),
              delay,
              scrollTrigger: trigger,
            }),
        });
      });

      if (!hero || useApp.getState().preloaded) {
        play();
        return;
      }
      const unsub = useApp.subscribe((s) => {
        if (s.preloaded) {
          unsub();
          play();
        }
      });
      return unsub;
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} data-reveal="" className={className} style={style} id={id} {...data}>
      {children}
    </Tag>
  );
}
