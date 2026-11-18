/**
 * Validates /content against the Zod schema and prints every [EDIT] placeholder.
 * Run with: npm run content:check
 */
import { validateContent } from '../content/schema.ts';
import { site, nav, nextUp, pageSeo } from '../content/site.ts';
import { home } from '../content/home.ts';
import { about } from '../content/about.ts';
import { resume, contact, notFound } from '../content/resume.ts';
import { caseStudies } from '../content/work/index.ts';
import { askYourData } from '../content/modules/ask-your-data.ts';

validateContent();
console.log('✓ content is valid\n');

const found: { path: string; text: string }[] = [];

function walk(value: unknown, path: string): void {
  if (typeof value === 'string') {
    if (value.includes('[EDIT')) found.push({ path, text: value });
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${path}[${i}]`));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
  }
}

walk({ site, nav, nextUp, pageSeo }, 'site');
walk(home, 'home');
walk(about, 'about');
walk({ resume, contact, notFound }, 'resume');
for (const c of caseStudies) walk(c, `work/${c.slug}`);
walk({ 'ask-your-data': askYourData }, 'modules');

if (site.github === null) found.push({ path: 'site.github', text: '[EDIT: GitHub URL or keep hidden]' });
found.push({ path: 'site.url', text: `[EDIT: domain] currently ${site.url}` });

console.log(`${found.length} [EDIT] placeholders:\n`);
for (const f of found) {
  const short = f.text.length > 140 ? `${f.text.slice(0, 137)}…` : f.text;
  console.log(`- ${f.path}\n    ${short}`);
}
