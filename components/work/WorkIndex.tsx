'use client';
import { useState } from 'react';
import { Poster } from '@/components/poster/Poster';
import { TransitionLink } from '@/components/transition/TransitionLink';
import { workIndex } from '@/content/work';
import type { CaseStudy } from '@/content/types';

type WorkCard = Pick<CaseStudy, 'slug' | 'no' | 'title' | 'kind' | 'kindLabel' | 'kicker' | 'tint' | 'when'>;
export function WorkIndex({ cases }: { cases: WorkCard[] }) {
  const [filter, setFilter] = useState('all');
  const shown = cases.filter((c) => filter === 'all' || c.kind === filter);
  return (
    <section className="wrap" data-chapter="Projects" aria-label="Project index">
      <div className="work-filter-bar">
        <fieldset>
          <legend className="sr-only">Filter projects</legend>
          <div className="flex flex-wrap gap-3">
            {workIndex.filters.map((f) => (
              <button
                type="button"
                key={f.id}
                className="btn btn-sm"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
                <span aria-hidden="true" className="text-mute ml-2">
                  {f.id === 'all' ? cases.length : cases.filter((c) => c.kind === f.id).length}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
        <p className="text-caption" role="status">
          {shown.length} {shown.length === 1 ? 'project' : 'projects'}
        </p>
      </div>
      <ol className="work-index-grid">
        {shown.map((c) => (
          <li key={c.slug}>
            <TransitionLink
              href={`/work/${c.slug}`}
              shared={c.slug}
              data-poster-host=""
              data-cursor="Open"
              className="work-index-card group"
            >
              <div className="work-index-art">
                <Poster slug={c.slug} tint={c.tint} className="h-full w-full" />
                <span className="work-index-number" aria-hidden="true">
                  {c.no}
                </span>
              </div>
              <p className="text-label text-mute mt-5 flex justify-between gap-4">
                <span>{c.kindLabel}</span>
                <span>{c.when}</span>
              </p>
              <h2 data-shared-title className="text-title mt-3">
                {c.title}
                <span className="text-accent ml-2" aria-hidden="true">
                  ↗
                </span>
              </h2>
              <p className="text-small text-mute mt-2">{c.kicker}</p>
            </TransitionLink>
          </li>
        ))}
      </ol>
      <p className="text-caption mt-12 max-w-[70ch]">{workIndex.note}</p>
    </section>
  );
}
