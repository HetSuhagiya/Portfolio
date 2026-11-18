import type { ReactNode } from 'react';
import { Page } from '@/components/layout/Page';
import { Reveal } from '@/components/motion/Reveal';
import { Counter } from '@/components/motion/Counter';
import { Poster } from '@/components/poster/Poster';
import { Caption, Copy, isOnlyEdit } from '@/components/ui/Copy';
import { site } from '@/content/site';
import { nextCase } from '@/content/work';
import type { CaseStudy } from '@/content/types';
import { Glyph } from './Glyph';
import { Mess } from './Mess';
import { Approach } from './Approach';
import { Diagram } from './Diagram';
import { SnippetView } from './SnippetView';
import { CaseSignal } from './CaseSignal';
import { CaseDock } from './CaseDock';

/** Chapter opener: oversized numeral, mono label, 1px rule. */
function ChapterHead({ no, label, id, children }: { no: string; label: string; id: string; children: ReactNode }) {
  return (
    <header className="grid-12 items-end gap-y-4">
      <div className="col-span-12 flex items-baseline gap-4 lg:col-span-3">
        <span aria-hidden="true" className="text-display-md tnum text-line-strong">
          {no}
        </span>
        <span className="text-label text-mute">{label}</span>
      </div>
      <Reveal as="h2" id={id} className="text-display-md col-span-12 lg:col-span-9">
        {children}
      </Reveal>
      <div className="rule sda-rule col-span-12 mt-4" />
    </header>
  );
}

/**
 * The one template behind every /work/[slug] page.
 * Content comes from /content/work/*.ts; the only per-page code is the signature module.
 */
export function CaseStudyTemplate({ c }: { c: CaseStudy }) {
  const next = nextCase(c.slug);
  const showOutcomeEdit = c.outcome.edit && site.showEditMarkers;
  const facts: [string, ReactNode][] = [
    ['Role', <Copy key="r">{c.facts.role}</Copy>],
    ['Type', <Copy key="t">{c.facts.type}</Copy>],
    ['Period', <Copy key="p">{c.facts.period}</Copy>],
  ];

  return (
    <Page
      next={{
        href: `/work/${next.slug}`,
        eyebrow: 'Next project',
        label: next.title,
        caption: next.signalCaption,
        next: { slug: next.slug, tint: next.tint, no: next.no, kicker: next.kicker },
      }}
    >
      <CaseSignal signal={c.signal} />
      <CaseDock />

      {/* 1. Hero */}
      <section data-chapter="Intro" className="wrap relative flex min-h-svh flex-col justify-between gap-10 pt-[calc(var(--bar-h)+1.5rem)] pb-[5vh]">
        <div className="flex items-start justify-between gap-6">
          <p className="text-label text-mute">
            <span className="tnum text-fg">{c.no}</span>
            <span className="mx-3">/</span>
            {c.kindLabel}
          </p>
          <Caption className="hidden max-w-[40ch] text-right sm:block">{c.signalCaption}</Caption>
        </div>

        <div className="grid-12 items-end gap-y-8">
          <div className="col-span-12 lg:col-span-9">
            <p className="text-caption mb-4">{`// ${c.kicker.toLowerCase()}`}</p>
            <h1 data-hero-title className="text-display-lg">
              {c.title}
            </h1>
            <Reveal as="p" hero delay={0.25} className="text-lead mt-8 max-w-[44ch]">
              {c.summary}
            </Reveal>
          </div>
          <div className="col-span-6 col-start-1 row-start-1 sm:col-span-4 lg:col-span-3 lg:col-start-10 lg:row-start-auto">
            <Poster slug={c.slug} tint={c.tint} hero className="aspect-[4/5] w-full border border-line" />
          </div>

          <dl className="col-span-12 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-5 lg:grid-cols-12">
            {facts.map(([k, v]) => (
              <div key={k} className="lg:col-span-2">
                <dt className="text-label text-mute">{k}</dt>
                <dd className="text-small mt-1.5">{v}</dd>
              </div>
            ))}
            <div className="col-span-2 lg:col-span-6">
              <dt className="text-label text-mute">
                <Copy>{c.facts.stackLabel ?? 'Stack'}</Copy>
              </dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">
                {c.facts.stack.map((s) => (
                  <span key={s} className="chip">
                    {s}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <div id="case-body">
        {/* 2. The brief */}
        <section data-chapter="Brief" aria-labelledby="brief-title" className="wrap py-[14vh]">
          <div className="grid-12 items-center gap-y-10">
            <div className="col-span-12 flex items-baseline gap-4 self-start lg:col-span-3">
              <span aria-hidden="true" className="text-display-md tnum text-line-strong">
                01
              </span>
              <h2 id="brief-title" className="text-label text-mute">
                The brief
              </h2>
            </div>
            <Reveal as="p" className="text-title col-span-12 md:col-span-7 lg:col-span-5">
              <Copy>{c.brief.body}</Copy>
            </Reveal>
            <figure className="sda-fade col-span-8 col-start-3 md:col-span-4 md:col-start-9 lg:col-span-3 lg:col-start-10">
              <Glyph id={c.brief.glyph} className="h-auto w-full" />
              <figcaption className="text-caption mt-3">{c.brief.caption}</figcaption>
            </figure>
          </div>
        </section>

        {/* 3. The challenge */}
        <section data-chapter="Challenge" aria-labelledby="challenge-title" className="wrap py-[10vh]">
          <ChapterHead no="02" label="The challenge" id="challenge-title">
            {c.challenge.heading}
          </ChapterHead>
          <div className="grid-12 mt-10 gap-y-8">
            <Reveal as="p" className="text-lead col-span-12 text-mute lg:col-span-4">
              <Copy>{c.challenge.body}</Copy>
            </Reveal>
            <div className="col-span-12 lg:col-span-7 lg:col-start-6">
              <Mess mess={c.challenge.mess} caption={c.challenge.caption} />
            </div>
          </div>
        </section>

        {/* 4. The approach: the signature module */}
        <Approach approach={c.approach} />

        {/* 5. The build */}
        <section data-chapter="Build" aria-labelledby="build-title" className="wrap py-[12vh]">
          <ChapterHead no="04" label="The build" id="build-title">
            {c.build.heading}
          </ChapterHead>
          <div className="grid-12 mt-10 gap-y-10">
            <Reveal as="p" className="text-lead col-span-12 text-mute lg:col-span-5">
              <Copy>{c.build.body}</Copy>
            </Reveal>
            <div className="col-span-12">
              <Diagram spec={c.build.diagram} />
            </div>
            <div className="col-span-12">
              <SnippetView snippet={c.build.snippet} />
            </div>
          </div>
        </section>

        {/* Optional extras: an honest "how it works" and the design decisions */}
        {c.extras?.howItWorks ? (
          <section aria-labelledby="how-title" className="wrap py-[8vh]">
            <h2 id="how-title" className="text-display-sm">
              {c.extras.howItWorks.heading}
            </h2>
            <ol className="mt-8 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {c.extras.howItWorks.steps.map((s, i) => (
                <li key={s.title} className="sda-fade border-t border-line pt-4">
                  <span className="text-label tnum text-accent">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="text-title mt-3">{s.title}</h3>
                  <p className="text-small mt-2 text-mute">
                    <Copy>{s.body}</Copy>
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        {c.extras?.decisions ? (
          <section aria-labelledby="decisions-title" className="wrap grid-12 gap-y-6 py-[8vh]">
            <h2 id="decisions-title" className="text-display-sm col-span-12 lg:col-span-4">
              {c.extras.decisions.heading}
            </h2>
            <ul className="col-span-12 lg:col-span-7 lg:col-start-6">
              {c.extras.decisions.items
                .filter((d) => site.showEditMarkers || !isOnlyEdit(d))
                .map((d, i) => (
                  <li key={i} className="sda-fade flex gap-5 border-t border-line py-4 last:border-b">
                    <span aria-hidden="true" className="text-label tnum pt-1 text-mute">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-body">
                      <Copy>{d}</Copy>
                    </p>
                  </li>
                ))}
            </ul>
          </section>
        ) : null}

        {/* 6. The outcome: facts only */}
        <section data-chapter="Outcome" aria-labelledby="outcome-title" className="wrap py-[12vh]">
          <ChapterHead no="05" label="The outcome" id="outcome-title">
            {c.outcome.heading}
          </ChapterHead>
          <div className="grid-12 mt-10 gap-y-10">
            <div className="col-span-12 lg:col-span-5">
              <Reveal as="p" className="text-lead">
                <Copy>{c.outcome.body}</Copy>
              </Reveal>
              {showOutcomeEdit ? (
                <p className="mt-6">
                  <Copy>{c.outcome.edit!}</Copy>
                </p>
              ) : null}
            </div>
            {c.outcome.stats.length ? (
              <dl className="col-span-12 grid gap-8 sm:grid-cols-2 lg:col-span-6 lg:col-start-7">
                {c.outcome.stats.map((s) => (
                  <div key={s.label} className="flex flex-col-reverse border-t border-line pt-4">
                    <dt className="text-label mt-2 text-mute">{s.label}</dt>
                    <dd>
                      <Counter value={s.value} prefix={s.prefix} suffix={s.suffix} className="text-display-lg text-accent" />
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </section>

        {/* 7. What I learned */}
        <section data-chapter="Learned" aria-labelledby="learned-title" className="wrap grid-12 gap-y-6 py-[10vh]">
          <div className="col-span-12 flex items-baseline gap-4 lg:col-span-3">
            <span aria-hidden="true" className="text-display-md tnum text-line-strong">
              06
            </span>
            <h2 id="learned-title" className="text-label text-mute">
              What I learned, what I would do next
            </h2>
          </div>
          <Reveal as="p" className="text-display-sm col-span-12 lg:col-span-8 lg:col-start-5">
            <Copy>{c.learned.body}</Copy>
          </Reveal>
        </section>
      </div>
    </Page>
  );
}
