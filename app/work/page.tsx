import { Page } from '@/components/layout/Page';
import { PageHeading } from '@/components/layout/PageHeading';
import { WorkIndex } from '@/components/work/WorkIndex';
import { caseStudies, workIndex } from '@/content/work';
import { nextUp, pageSeo } from '@/content/site';
import { buildMetadata } from '@/lib/seo';
export const metadata = buildMetadata({ ...pageSeo.work, path: '/work' });
export default function WorkPage() {
  const cases = caseStudies.map(({ slug, no, title, kind, kindLabel, kicker, tint, when }) => ({
    slug,
    no,
    title,
    kind,
    kindLabel,
    kicker,
    tint,
    when,
  }));
  return (
    <Page next={nextUp['/work']!}>
      <PageHeading eyebrow={workIndex.eyebrow} title={workIndex.heading} description={workIndex.intro} />
      <WorkIndex cases={cases} />
    </Page>
  );
}
