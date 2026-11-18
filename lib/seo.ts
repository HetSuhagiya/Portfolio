import type { Metadata } from 'next';
import { site } from '@/content/site';
import type { CaseStudy } from '@/content/types';
import { stripEdits } from './utils';

export function buildMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = path === '/' ? '/' : path;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: `${site.name}, ${site.role}`,
      locale: 'en_GB',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export function personJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    jobTitle: site.role,
    description: site.summary,
    url: site.url,
    email: `mailto:${site.email}`,
    address: { '@type': 'PostalAddress', addressLocality: 'London', addressCountry: 'GB' },
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'Brunel University of London' },
    worksFor: { '@type': 'Organization', name: site.company.name, url: site.company.url },
    sameAs: [site.linkedin, ...(site.github ? [site.github] : [])],
    knowsAbout: ['SQL', 'Python', 'Google BigQuery', 'Tableau', 'Looker Studio', 'Data modelling', 'Business intelligence', 'Funnel.io', 'Vertex AI'],
  };
}

export function caseJsonLd(c: CaseStudy): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: c.seo.title,
    headline: `${c.title}: ${c.kicker}`,
    description: c.seo.description,
    url: `${site.url}/work/${c.slug}`,
    author: { '@type': 'Person', name: site.name, url: site.url },
    creator: { '@type': 'Person', name: site.name },
    keywords: c.facts.stack.join(', '),
    about: stripEdits(c.summary),
    inLanguage: 'en-GB',
  };
}

export function JsonLdScript(data: Record<string, unknown>): { __html: string } {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}
