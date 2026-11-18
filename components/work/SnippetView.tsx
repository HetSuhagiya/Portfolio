'use client';

import { useMemo, useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { highlight } from '@/lib/highlight';
import { prefersReducedMotion } from '@/lib/utils';
import { Copy } from '@/components/ui/Copy';
import type { Snippet } from '@/content/types';

const CHARS_PER_SECOND = 95;

/**
 * An illustrative snippet that types itself out, with annotations that appear as each line lands.
 * The code is real text in the HTML (selectable, readable by screen readers, visible without JS);
 * typing is a clip-path reveal, so nothing reflows.
 */
export function SnippetView({ snippet }: { snippet: Snippet }) {
  const ref = useRef<HTMLElement>(null);
  const lines = useMemo(() => highlight(snippet.code, snippet.lang), [snippet]);
  const raw = useMemo(() => snippet.code.split('\n'), [snippet]);
  const noted = useMemo(() => new Map(snippet.notes.map((n, i) => [n.line, i])), [snippet]);

  useGSAP(
    (_, contextSafe) => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const rows = gsap.utils.toArray<HTMLElement>('[data-line]', el);
      const notes = gsap.utils.toArray<HTMLElement>('[data-note]', el);
      const caret = el.querySelector<HTMLElement>('[data-caret]');
      const replay = el.querySelector<HTMLButtonElement>('[data-replay]');

      gsap.set(rows, { clipPath: 'inset(0 100% 0 0)' });
      gsap.set(notes, { opacity: 0, y: 10 });
      const tl = gsap.timeline({ paused: true, defaults: { overwrite: false } });
      if (caret) tl.set(caret, { opacity: 1 }, 0);
      rows.forEach((row, i) => {
        const len = Math.max(1, raw[i]?.length ?? 1);
        const duration = len / CHARS_PER_SECOND;
        tl.to(row, { clipPath: 'inset(0 0% 0 0)', duration, ease: `steps(${len})` });
        if (caret) tl.fromTo(caret, { '--cx': 0, '--cy': i }, { '--cx': len, duration, ease: `steps(${len})`, immediateRender: false }, '<');
        const ni = noted.get(i + 1);
        if (ni !== undefined && notes[ni]) tl.to(notes[ni]!, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, '>-0.05');
      });
      if (replay) tl.fromTo(replay, { opacity: 0 }, { opacity: 1, duration: 0.3 });

      ScrollTrigger.create({ trigger: el, start: 'top 70%', once: true, onEnter: () => tl.play() });
      const onReplay = contextSafe!(() => tl.restart());
      replay?.addEventListener('click', onReplay);
      return () => replay?.removeEventListener('click', onReplay);
    },
    { scope: ref },
  );

  return (
    <figure ref={ref} className="grid-12 gap-y-6">
      <div className="panel col-span-12 overflow-clip lg:col-span-8">
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-2.5">
          <p className="text-label text-mute">
            <span className="text-accent">{snippet.lang}</span>
            <span className="mx-2">·</span>
            {snippet.title}
          </p>
          <button type="button" data-replay className="text-label min-h-8 px-2 text-mute hover:text-fg">
            Replay ↺
          </button>
        </div>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={`Code: ${snippet.title}`}>
          <pre className="code relative w-max min-w-full py-4 pr-6">
            <span data-caret aria-hidden="true" className="code-caret" />
            <code>
              {lines.map((tokens, i) => (
                <span key={i} className="code-row">
                  <span aria-hidden="true" className={noted.has(i + 1) ? 'code-no text-accent' : 'code-no'}>
                    {i + 1}
                  </span>
                  <span data-line className="code-line">
                    {tokens.length ? (
                      tokens.map((t, j) => (
                        <span key={j} className={`tok-${t.t}`}>
                          {t.v}
                        </span>
                      ))
                    ) : (
                      <span> </span>
                    )}
                  </span>
                  {'\n'}
                </span>
              ))}
            </code>
          </pre>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4">
        <ol className="space-y-4" aria-label="Notes on the code">
          {snippet.notes.map((n) => (
            <li key={n.line} data-note className="border-t border-line pt-3">
              <span className="text-label tnum text-accent">{`Line ${n.line}`}</span>
              <p className="text-small mt-1">{n.text}</p>
            </li>
          ))}
        </ol>
        <figcaption className="text-caption mt-6">
          <Copy>{snippet.caption}</Copy>
        </figcaption>
      </div>
    </figure>
  );
}
