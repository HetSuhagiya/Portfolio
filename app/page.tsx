import { Page } from '@/components/layout/Page';
import { Reveal } from '@/components/motion/Reveal';
import { Caption } from '@/components/ui/Copy';
import { Hero } from '@/components/home/Hero';
import { Connect } from '@/components/home/Connect';
import { Own } from '@/components/home/Own';
import { Act } from '@/components/home/Act';
import { Featured } from '@/components/home/Featured';
import { ContactTeaser } from '@/components/home/ContactTeaser';
import { buildMetadata } from '@/lib/seo';
import { nextUp, pageSeo } from '@/content/site';
import { home } from '@/content/home';
import { caseStudies } from '@/content/work';

export const metadata = buildMetadata({ ...pageSeo.home, path: '/' });

export default function HomePage() {
  const cases = caseStudies.map((c) => ({
    slug: c.slug,
    no: c.no,
    title: c.title,
    kindLabel: c.kindLabel,
    kicker: c.kicker,
    tint: c.tint,
  }));

  return (
    <Page next={{ ...nextUp['/']!, caption: '// seven pieces of work, indexed' }}>
      <Hero />

      <section className="wrap grid-12 gap-y-6 py-[18vh]" aria-labelledby="method-title">
        <Caption className="col-span-12 md:col-span-3">{home.framework.eyebrow}</Caption>
        <div className="col-span-12 md:col-span-9">
          <Reveal as="h2" id="method-title" className="text-display-md">
            {home.framework.heading}
          </Reveal>
          <Reveal as="p" delay={0.1} className="text-lead mt-8 max-w-[40ch] text-mute">
            {home.framework.body}
          </Reveal>
        </div>
      </section>

      <Connect />
      <Own />
      <Act />
      <Featured cases={cases} />
      <ContactTeaser />
    </Page>
  );
}
