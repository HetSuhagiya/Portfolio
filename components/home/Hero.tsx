import { Reveal } from '@/components/motion/Reveal';
import { Magnetic } from '@/components/motion/Magnetic';
import { TransitionLink } from '@/components/transition/TransitionLink';
import { Caption } from '@/components/ui/Copy';
import { home } from '@/content/home';
import { site } from '@/content/site';

/** 1. Hero: noise has resolved into one thread. The name reveals per character. */
export function Hero() {
  const h = home.hero;
  return (
    <section
      data-chapter="Signal"
      className="wrap relative flex min-h-svh flex-col justify-between pt-[calc(var(--bar-h)+1.5rem)] pb-[5vh]"
    >
      <div className="flex items-start justify-between gap-6">
        <Reveal type="fade" hero delay={0.5}>
          <Caption>{h.eyebrow}</Caption>
        </Reveal>
        <Reveal type="fade" hero delay={0.7} className="hidden text-right sm:block">
          <Caption>{h.caption}</Caption>
        </Reveal>
      </div>

      <div>
        <Reveal as="h1" type="chars" hero className="text-display-xl -ml-[0.04em]">
          {h.name}
        </Reveal>
        <div className="grid-12 mt-[4vh] items-end gap-y-8">
          <Reveal as="p" hero delay={0.35} className="text-lead col-span-12 max-w-[30ch] md:col-span-6">
            {h.subline}
          </Reveal>
          <Reveal type="fade" hero delay={0.6} className="col-span-12 flex flex-wrap items-center gap-3 md:col-span-6 md:justify-end">
            <Magnetic>
              <TransitionLink href={h.primaryCta.href} className="btn btn-solid" data-cursor="Go">
                {h.primaryCta.label}
                <span aria-hidden="true">→</span>
              </TransitionLink>
            </Magnetic>
            <Magnetic>
              <a href={site.cv.href} download={site.cv.filename} className="btn">
                {h.cvCta.label}
                <span aria-hidden="true">↓</span>
              </a>
            </Magnetic>
          </Reveal>
        </div>
        <Reveal type="fade" hero delay={0.9} className="mt-[5vh] flex items-center gap-3">
          <span aria-hidden="true" className="scroll-cue block h-8 w-px bg-line-strong" />
          <span className="text-label text-mute">{h.scrollHint}</span>
        </Reveal>
      </div>
    </section>
  );
}
