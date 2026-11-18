/**
 * Zod schemas for the content. Server/build only: never import this file from a client component,
 * so Zod stays out of the browser bundle. `validateContent()` runs from the root layout at build time
 * and from `npm run content:check`.
 */
import { z } from 'zod';
import { caseStudies } from './work/index.ts';
import { site } from './site.ts';

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected a 6-digit hex colour');

const layout = z.enum([
  'noise',
  'thread',
  'lattice',
  'merge',
  'grid',
  'bars',
  'dots',
  'caret',
  'tiles',
  'combed',
  'pipeline',
  'point',
  'broken',
]);

const signal = z.object({
  layout,
  color: hex,
  accent: z.number().min(0).max(1).optional(),
  turbulence: z.number().min(0).max(2).optional(),
  flow: z.number().min(0).max(2).optional(),
  spread: z.number().min(0).max(2).optional(),
  param: z.number().min(0).max(1).optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  scale: z.number().positive().optional(),
  fluid: z.number().min(0).max(2).optional(),
  intensity: z.number().min(0).max(2).optional(),
});

/** No block of body copy may run long: the layout pairs every block with a visual. */
const block = (max: number) =>
  z.string().refine((s) => s.replace(/\[EDIT[^\]]*\]/g, '').trim().split(/\s+/).length <= max, {
    message: `block is longer than ${max} words`,
  });

const caseStudy = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  no: z.string().regex(/^\d{2}$/),
  title: z.string().min(1),
  short: z.string().min(1),
  kind: z.enum(['client', 'built', 'internship']),
  kindLabel: z.string().min(1),
  kicker: z.string().min(1),
  summary: block(40),
  when: z.string().min(1),
  facts: z.object({
    role: z.string(),
    type: z.string(),
    period: z.string(),
    stack: z.array(z.string()).min(1),
    stackLabel: z.string().optional(),
  }),
  theme: z.enum(['ink', 'paper']),
  tint: hex,
  signal,
  signalCaption: z.string().startsWith('//'),
  seo: z.object({ title: z.string().max(110), description: z.string().min(50).max(220) }),
  brief: z.object({
    body: block(70),
    caption: z.string().startsWith('//'),
    glyph: z.enum(['layers', 'tree', 'clock', 'pipeline', 'dots', 'prompt', 'table']),
  }),
  challenge: z.object({
    heading: z.string(),
    body: block(60),
    caption: z.string().startsWith('//'),
    mess: z.object({
      fragments: z.array(z.string()).min(6).max(14),
      resolved: z.array(z.string()).min(2).max(6),
      chaosLabel: z.string().startsWith('//'),
      orderLabel: z.string().startsWith('//'),
    }),
  }),
  approach: z.object({
    heading: z.string(),
    intro: block(60),
    module: z.enum([
      'build-the-report',
      'kpi-tree',
      'manual-vs-automated',
      'follow-the-data',
      'ten-thousand-sales',
      'ask-your-data',
      'clean-the-file',
    ]),
    moduleTitle: z.string(),
    alt: z.string().min(40),
    caption: z.string().startsWith('//'),
    chapters: z.array(z.object({ title: z.string(), body: block(40) })).length(4),
  }),
  build: z.object({
    heading: z.string(),
    body: block(60),
    diagram: z.object({
      caption: z.string().startsWith('//'),
      nodes: z
        .array(
          z.object({
            id: z.string(),
            label: z.string(),
            sub: z.string().optional(),
            col: z.number(),
            row: z.number(),
            decision: z.boolean().optional(),
          }),
        )
        .min(2),
      edges: z.array(z.tuple([z.string(), z.string()])),
    }),
    snippet: z.object({
      lang: z.enum(['sql', 'python', 'json']),
      title: z.string(),
      caption: z.string().startsWith('//'),
      code: z.string().min(20),
      notes: z.array(z.object({ line: z.number().int().positive(), text: z.string() })),
    }),
  }),
  outcome: z.object({
    heading: z.string(),
    body: block(60),
    stats: z.array(
      z.object({
        value: z.number(),
        prefix: z.string().optional(),
        suffix: z.string().optional(),
        label: z.string(),
      }),
    ),
    edit: z.string().optional(),
  }),
  learned: z.object({ body: block(60) }),
  extras: z
    .object({
      howItWorks: z
        .object({
          heading: z.string(),
          steps: z.array(z.object({ title: z.string(), body: block(40) })),
        })
        .optional(),
      decisions: z.object({ heading: z.string(), items: z.array(z.string()) }).optional(),
    })
    .optional(),
});

const siteSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  email: z.string().email(),
  linkedin: z.string().url(),
  github: z.string().url().nullable(),
  cv: z.object({ href: z.string().startsWith('/'), filename: z.string().endsWith('.pdf') }),
});

/** Throws a readable error when any content file is invalid. */
export function validateContent(): void {
  const problems: string[] = [];

  const s = siteSchema.safeParse(site);
  if (!s.success) problems.push(`site.ts\n${z.prettifyError(s.error)}`);

  const slugs = new Set<string>();
  for (const c of caseStudies) {
    const r = caseStudy.safeParse(c);
    if (!r.success) problems.push(`work/${c.slug}.ts\n${z.prettifyError(r.error)}`);
    if (slugs.has(c.slug)) problems.push(`duplicate slug: ${c.slug}`);
    slugs.add(c.slug);

    const ids = new Set(c.build.diagram.nodes.map((n) => n.id));
    for (const [a, b] of c.build.diagram.edges) {
      if (!ids.has(a) || !ids.has(b)) problems.push(`work/${c.slug}.ts: diagram edge ${a} → ${b} points at a missing node`);
    }
    const lines = c.build.snippet.code.split('\n').length;
    for (const n of c.build.snippet.notes) {
      if (n.line > lines) problems.push(`work/${c.slug}.ts: snippet note on line ${n.line}, but the code has ${lines} lines`);
    }
  }

  if (problems.length) {
    throw new Error(`Content validation failed:\n\n${problems.join('\n\n')}\n`);
  }
}
