import { Page } from '@/components/layout/Page';
import { PageHeading } from '@/components/layout/PageHeading';
import { Toolkit } from '@/components/about/Toolkit';
import { Reveal } from '@/components/motion/Reveal';
import { Copy, Caption } from '@/components/ui/Copy';
import { TransitionLink } from '@/components/transition/TransitionLink';
import { about } from '@/content/about';
import { nextUp, pageSeo } from '@/content/site';
import { buildMetadata } from '@/lib/seo';
export const metadata = buildMetadata({ ...pageSeo.about, path: '/about' });
export default function AboutPage() {
  return (
    <Page next={nextUp['/about']!}>
      <PageHeading eyebrow={about.hero.eyebrow} title={about.hero.heading} description={about.hero.subline}>
        <TransitionLink href="/resume" className="btn">
          Read my résumé ↗
        </TransitionLink>
      </PageHeading>
      <section
        className="wrap page-section grid-12 gap-y-6"
        data-chapter="Origin"
        aria-labelledby="origin-title"
      >
        <div className="col-span-12 md:col-span-4">
          <Caption>{about.origin.eyebrow}</Caption>
          <h2 id="origin-title" className="text-display-sm mt-4">
            {about.origin.heading}
          </h2>
        </div>
        <Reveal as="p" className="text-lead col-span-12 max-w-[48ch] md:col-span-8">
          <Copy>{about.origin.body}</Copy>
        </Reveal>
      </section>
      <section className="wrap page-section" data-chapter="Timeline" aria-labelledby="timeline-title">
        <Caption>{about.timeline.eyebrow}</Caption>
        <h2 id="timeline-title" className="text-display-md mt-4 mb-10">
          {about.timeline.heading}
        </h2>
        <ol className="about-timeline">
          {about.timeline.items.map((item, i) => (
            <li key={item.id} className="grid-12 border-line gap-y-4 border-t py-9">
              <div className="col-span-12 md:col-span-3">
                <span className="text-caption">{String(i + 1).padStart(2, '0')}</span>
                <p className="text-small text-mute mt-2">
                  <Copy>{item.when}</Copy>
                </p>
              </div>
              <div className="col-span-12 md:col-span-9">
                <h3 className="text-title">{item.title}</h3>
                <p className="text-body mt-1">{item.place}</p>
                <p className="text-body text-mute mt-5 max-w-[58ch]">{item.body}</p>
                <ul className="mt-5 flex flex-wrap gap-2" aria-label="Skills and highlights">
                  {item.tags.map((tag) => (
                    <li key={tag} className="chip">
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="wrap page-section" data-chapter="Method" aria-labelledby="method-heading">
        <Caption>{about.howIWork.eyebrow}</Caption>
        <h2 id="method-heading" className="text-display-md mt-4 mb-10">
          {about.howIWork.heading}
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {about.howIWork.items.map((item) => (
            <article key={item.no} className="border-line border-t pt-6">
              <p className="text-caption">{item.no}</p>
              <h3 className="text-title mt-4">{item.title}</h3>
              <p className="text-body text-mute mt-4">{item.principle}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="wrap page-section" data-chapter="Toolkit" aria-labelledby="toolkit-title">
        <Caption>{about.toolkit.eyebrow}</Caption>
        <h2 id="toolkit-title" className="text-display-md mt-4 mb-10">
          {about.toolkit.heading}
        </h2>
        <Toolkit />
      </section>
    </Page>
  );
}
