'use client';

import { useRef } from 'react';
import { ScrollTrigger, useGSAP } from '@/lib/gsap';
import { blendToward, releaseSignal } from '@/lib/signal';
import { prefersReducedMotion } from '@/lib/utils';
import { TransitionLink } from '@/components/transition/TransitionLink';
import { useTransition } from '@/components/transition/TransitionProvider';
import { Poster } from '@/components/poster/Poster';
import { site } from '@/content/site';

type Props = {
  href: string;
  eyebrow: string;
  label: string;
  caption?: string;
  /** When the target is a case study: its slug and tint, for the poster and the shared transition. */
  next?: { slug: string; tint: string; no: string; kicker: string };
};

/**
 * The giant "next" link that closes every page. Scrolling into it pulls the signal toward the
 * next page's state, so the transition is already underway before the click.
 */
export function NextFooter({ href, eyebrow, label, caption, next }: Props) {
  const ref = useRef<HTMLElement>(null);
  const { routeFor } = useTransition();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const target = routeFor(href).signal;
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        end: 'bottom bottom',
        onUpdate: (self) => blendToward('footer', target, self.progress * 0.85),
        onLeaveBack: () => releaseSignal('footer'),
      });
      return () => {
        st.kill();
        releaseSignal('footer');
      };
    },
    { scope: ref, dependencies: [href] },
  );

  return (
    <footer ref={ref} className="relative mt-[18vh]">
      <div className="wrap">
        <div className="rule sda-rule" />
        <TransitionLink
          href={href}
          shared={next?.slug}
          data-poster-host=""
          data-cursor="Open"
          className="group grid-12 items-end gap-y-8 py-[10vh]"
        >
          <span className="col-span-12 flex items-baseline justify-between gap-6 lg:col-span-12">
            <span className="text-label text-mute">
              {eyebrow}
              {next ? <span className="tnum ml-3 text-fg">{next.no}</span> : null}
            </span>
            {caption ? <span className="text-caption hidden sm:block">{caption}</span> : null}
          </span>
          <span className={next ? 'col-span-12 lg:col-span-9' : 'col-span-12'}>
            <span
              data-shared-title
              className="text-display-lg block transition-transform duration-700 ease-(--ease-out) group-hover:translate-x-[1.5vw]"
            >
              {label}
              <span aria-hidden="true" className="ml-[0.18em] inline-block text-accent transition-transform duration-700 ease-(--ease-out) group-hover:translate-x-[0.2em]">
                →
              </span>
            </span>
            {next ? <span className="text-lead mt-5 block max-w-[38ch] text-mute">{next.kicker}</span> : null}
          </span>
          {next ? (
            <span className="col-span-7 col-start-1 sm:col-span-4 lg:col-span-3 lg:col-start-10">
              <Poster slug={next.slug} tint={next.tint} className="aspect-[4/5] w-full border border-line" />
            </span>
          ) : null}
        </TransitionLink>
      </div>

      <div className="wrap">
        <div className="rule" />
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-6">
          <p className="text-label text-mute">
            © {new Date().getFullYear()} {site.name} · {site.location}
          </p>
          <ul className="text-label flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <a className="link" href={`mailto:${site.email}`}>
                Email
              </a>
            </li>
            <li>
              <a className="link" href={site.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn ↗
              </a>
            </li>
            {site.github ? (
              <li>
                <a className="link" href={site.github} target="_blank" rel="noopener noreferrer">
                  GitHub ↗
                </a>
              </li>
            ) : null}
            <li>
              <a className="link" href={site.cv.href} download={site.cv.filename}>
                Download CV ↓
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
