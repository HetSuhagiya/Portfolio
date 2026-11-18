'use client';

import { useRef } from 'react';
import { ScrollTrigger, useGSAP } from '@/lib/gsap';
import { TransitionLink } from '@/components/transition/TransitionLink';
import { site } from '@/content/site';

/**
 * The sticky "Download CV" + "Contact" pair on every case study.
 * It appears once the hero has been read and steps aside for the "next project" footer.
 */
export function CaseDock() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    let past = false;
    let atEnd = false;
    const sync = () => el.toggleAttribute('data-show', past && !atEnd);
    const a = ScrollTrigger.create({
      start: () => window.innerHeight * 0.6,
      end: 'max',
      onToggle: (self) => {
        past = self.isActive || self.progress === 1;
        sync();
      },
    });
    const footer = document.querySelector('#page footer');
    const b = footer
      ? ScrollTrigger.create({
          trigger: footer,
          start: 'top 80%',
          end: 'max',
          onToggle: (self) => {
            atEnd = self.isActive || self.progress === 1;
            sync();
          },
        })
      : null;
    return () => {
      a.kill();
      b?.kill();
    };
  });

  return (
    <div ref={ref} data-chrome className="case-dock no-print" role="group" aria-label="Quick links">
      <a href={site.cv.href} download={site.cv.filename} className="btn btn-sm btn-solid">
        Download CV <span aria-hidden="true">↓</span>
      </a>
      <TransitionLink href="/contact" className="btn btn-sm case-dock-ghost">
        Contact
      </TransitionLink>
    </div>
  );
}
