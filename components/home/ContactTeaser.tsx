'use client';

import { useRef } from 'react';
import { ScrollTrigger, useGSAP } from '@/lib/gsap';
import { blendSignal, DECISION_COLOR } from '@/lib/signal';
import { easeInOut, fitLayout, fitted } from '@/lib/fit';
import { prefersReducedMotion } from '@/lib/utils';
import { Reveal } from '@/components/motion/Reveal';
import { Magnetic } from '@/components/motion/Magnetic';
import { TransitionLink } from '@/components/transition/TransitionLink';
import { Caption } from '@/components/ui/Copy';
import type { SignalPreset } from '@/content/types';
import { home } from '@/content/home';
import { site } from '@/content/site';
import { OWNER, stops } from './signal';

const c = home.contact;

/** 6. Contact teaser. Everything converges on one amber point: the destination of the signal. */
export function ContactTeaser() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = ref.current;
      if (!section || prefersReducedMotion()) return;
      const win = section.querySelector<HTMLElement>('[data-window]')!;
      let point: SignalPreset;
      const place = () => {
        point = fitted(
          { layout: 'point', color: DECISION_COLOR, accent: 1, turbulence: 0.12, flow: 0.3 },
          fitLayout('point', win, section),
        );
      };
      place();
      ScrollTrigger.addEventListener('refreshInit', place);
      ScrollTrigger.create({
        trigger: section,
        start: 'top 85%',
        end: 'top top',
        onUpdate: (self) => blendSignal(OWNER, stops.featured, point, easeInOut(self.progress)),
      });
      return () => ScrollTrigger.removeEventListener('refreshInit', place);
    },
    { scope: ref },
  );

  return (
    <section ref={ref} data-chapter="Contact" aria-labelledby="teaser-title" className="wrap grid-12 min-h-svh content-center items-center gap-y-10 py-[14vh]">
      <div className="col-span-12 lg:col-span-8">
        <Caption>{c.eyebrow}</Caption>
        <h2 id="teaser-title" className="text-display-lg mt-4 flex items-start gap-[0.2em]">
          <span className="pulse-dot mt-[0.42em] !h-[0.11em] !w-[0.11em]" aria-hidden="true" />
          <Reveal as="span" className="block">
            {c.heading}
          </Reveal>
        </h2>
        <Reveal as="p" delay={0.1} className="text-lead mt-8 max-w-[46ch]">
          {c.body}
        </Reveal>
        <Reveal type="fade" delay={0.2} className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Magnetic>
            <TransitionLink href={c.cta.href} className="btn btn-solid" data-cursor="Go">
              {c.cta.label}
              <span aria-hidden="true">→</span>
            </TransitionLink>
          </Magnetic>
          <a className="link font-mono text-sm" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          <a className="link text-label" href={site.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn ↗
          </a>
        </Reveal>
      </div>
      <div className="col-span-8 col-start-3 sm:col-span-6 sm:col-start-4 lg:col-span-4 lg:col-start-9">
        <div data-window className="relative aspect-square w-full">
          <svg className="gl-alt absolute inset-0 h-full w-full" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
            {[90, 62, 38, 18].map((r, i) => (
              <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="var(--decide)" strokeOpacity={0.2 + i * 0.2} />
            ))}
            <circle cx="100" cy="100" r="6" fill="var(--decide)" />
          </svg>
        </div>
        <Caption className="mt-3 text-center lg:text-right">{c.caption}</Caption>
      </div>
    </section>
  );
}
