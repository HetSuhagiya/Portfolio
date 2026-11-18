import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CaseStudyTemplate } from '@/components/work/CaseStudyTemplate';
import { caseBySlug, caseStudies } from '@/content/work';
import { buildMetadata, caseJsonLd, JsonLdScript } from '@/lib/seo';

type Params = { params: Promise<{ slug: string }> };

// Every case study is prerendered; unknown slugs go to the custom 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const c = caseBySlug(slug);
  if (!c) return {};
  return buildMetadata({ title: c.seo.title, description: c.seo.description, path: `/work/${c.slug}` });
}

export default async function CasePage({ params }: Params) {
  const { slug } = await params;
  const c = caseBySlug(slug);
  if (!c) notFound();
  return (
    <>
      <CaseStudyTemplate c={c} />
      <script type="application/ld+json" dangerouslySetInnerHTML={JsonLdScript(caseJsonLd(c))} />
    </>
  );
}
