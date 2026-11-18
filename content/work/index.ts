import type { CaseStudy } from '../types.ts';
import { publicisGroupe } from './publicis-groupe.ts';
import { pantherella } from './pantherella.ts';
import { christopherWard } from './christopher-ward.ts';
import { dashworxDataPlatform } from './dashworx-data-platform.ts';
import { yewTechnologies } from './yew-technologies.ts';
import { aiDashboardGenerator } from './ai-dashboard-generator.ts';
import { schemaInferencePlatform } from './schema-inference-platform.ts';

/**
 * The order here is the order everywhere: index, featured track, "next project" links.
 * To add a case study: copy one of the files in this folder, change the content,
 * add it to this array, and (optionally) build a module for it. See the README.
 */
export const caseStudies: CaseStudy[] = [
  publicisGroupe,
  pantherella,
  christopherWard,
  dashworxDataPlatform,
  yewTechnologies,
  aiDashboardGenerator,
  schemaInferencePlatform,
];

export const caseBySlug = (slug: string): CaseStudy | undefined => caseStudies.find((c) => c.slug === slug);

export const nextCase = (slug: string): CaseStudy => {
  const i = caseStudies.findIndex((c) => c.slug === slug);
  return caseStudies[(i + 1) % caseStudies.length]!;
};

export const workIndex = {
  eyebrow: '// index of work',
  heading: 'Work',
  intro: 'Three client accounts, one role, one internship and two things I built myself. Every page has something to play with.',
  filters: [
    { id: 'all', label: 'All' },
    { id: 'client', label: 'Client work' },
    { id: 'built', label: 'Built by me' },
  ],
  note: '// client names appear exactly as on my CV. No endorsement is implied. All demos use synthetic data.',
} as const;
