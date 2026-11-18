'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, useDragControls, type PanInfo } from 'motion/react';
import { gsap } from '@/lib/gsap';
import { highlight, type Token } from '@/lib/highlight';
import { Chart, type ChartKind } from '@/components/charts/Chart';
import { Num } from '@/hooks/useTween';
import { useReducedMotion } from '@/hooks/useMedia';
import { formatGBP, formatInt, prng } from '@/lib/utils';
import { askYourData, type AskPreset, type AskSeries, type AskTile, type AskUnit } from '@/content/modules/ask-your-data';
import type { ModuleProps } from './types';
import './ask-your-data.css';

const C = askYourData;
const L = C.labels;

/* ------------------------------------------------------------------ */
/* Synthetic data. Deterministic, generated here, never fetched.        */
/* ------------------------------------------------------------------ */

const DAYS = 56;
const WEEK = 7;

/**
 * 56 synthetic days: a slow drift, a weekend lift and day-to-day noise.
 * Volumes (sums) swing with the week far more than rates and averages do.
 * Additive series are whole numbers, so totals reconcile exactly.
 */
function daily(s: AskSeries): number[] {
  const r = prng(s.seed * 7919);
  const weekend = (s.agg === 'sum' ? 0.1 : 0.02) + r() * (s.agg === 'sum' ? 0.14 : 0.03);
  const noise = s.agg === 'sum' ? 0.16 : 0.07;
  let level = s.base * (0.88 + r() * 0.08);
  return Array.from({ length: DAYS }, (_, i) => {
    level += s.base * (r() - 0.42) * 0.022;
    const lift = i % WEEK >= 5 ? 1 + weekend : 1 - weekend * 0.4;
    const v = Math.max(s.base * 0.3, level * lift * (1 - noise / 2 + r() * noise));
    return s.agg === 'sum' ? Math.round(v) : v;
  });
}

const total = (v: number[]) => v.reduce((a, b) => a + b, 0);
const combine = (v: number[], agg: AskSeries['agg']) => (v.length === 0 ? 0 : agg === 'sum' ? total(v) : total(v) / v.length);

function weekly(v: number[], agg: AskSeries['agg']): number[] {
  const out: number[] = [];
  for (let i = 0; i < v.length; i += WEEK) out.push(combine(v.slice(i, i + WEEK), agg));
  return out;
}

/** Split a whole-number total across categories so the parts add up to it exactly (largest remainder). */
function split(sum: number, seed: number, n: number): number[] {
  const r = prng(seed * 104729);
  const w = Array.from({ length: n }, () => 0.35 + r() * 0.9);
  const exact = w.map((x) => (x / total(w)) * sum);
  const parts = exact.map(Math.floor);
  let left = Math.round(sum - total(parts));
  const order = exact.map((x, i) => [x - Math.floor(x), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (left <= 0) break;
    parts[i]! += 1;
    left -= 1;
  }
  return parts;
}

const full: Record<AskUnit, (n: number) => string> = {
  gbp: (n) => (Math.abs(n) < 1000 ? formatGBP(n, 2) : formatGBP(Math.round(n))),
  int: formatInt,
  pct: (n) => `${n.toFixed(2)}%`,
  x: (n) => `${n.toFixed(1)}×`,
};
const compact = (n: number) => (n >= 100_000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${Math.round(n)}`);
const pct1 = (n: number) => `${n.toFixed(1)}%`;
const short: Record<AskUnit, (n: number) => string> = {
  gbp: (n) => (n < 100 ? formatGBP(n, 2) : `£${compact(n)}`),
  int: compact,
  pct: (n) => `${n.toFixed(1)}%`,
  x: (n) => `${n.toFixed(1)}×`,
};

/* ------------------------------------------------------------------ */
/* Tile state and what each tile shows                                  */
/* ------------------------------------------------------------------ */

type FollowUp = 'grain' | 'recent' | 'sorted';
type Tile = AskTile & {
  grain: 'daily' | 'weekly';
  recent: boolean;
  sorted: boolean;
  /** The follow-up prompt being applied, while it "runs". */
  busy: string | null;
};
type View = {
  values: number[];
  /** Category labels (split tiles only). */
  labels?: string[];
  unit: AskUnit;
  headline: number;
  headlineLabel: string;
  delta: number;
  meta: string;
};

const toTile = (t: AskTile): Tile => ({ ...t, grain: 'daily', recent: false, sorted: false, busy: null });

function viewOf(tile: Tile, preset: AskPreset, data: Map<string, number[]>): View {
  const s = preset.series.find((x) => x.id === tile.series)!;
  const all = data.get(s.id)!;
  const headlineLabel = s.agg === 'sum' ? L.total : L.average;

  if (tile.split) {
    let rows = split(total(all), s.seed, preset.categories.length).map((v, i) => ({ v, label: preset.categories[i]! }));
    if (tile.sorted) rows = [...rows].sort((a, b) => b.v - a.v);
    if (tile.recent) rows = [...rows].sort((a, b) => b.v - a.v).slice(0, 3);
    const values = rows.map((x) => x.v);
    return { values, labels: rows.map((x) => x.label), unit: s.unit, headline: total(values), headlineLabel: L.total, delta: 0, meta: L.weeks8 };
  }

  const win = tile.recent ? all.slice(-DAYS / 2) : all;
  const half = win.length / 2;
  const before = combine(win.slice(0, half), s.agg);
  const delta = before === 0 ? 0 : combine(win.slice(half), s.agg) / before - 1;
  const range = tile.recent ? L.weeks4 : L.weeks8;
  if (tile.kind === 'kpi') {
    return { values: weekly(win, s.agg), unit: s.unit, headline: combine(win, s.agg), headlineLabel, delta, meta: range };
  }
  return {
    values: tile.grain === 'weekly' ? weekly(win, s.agg) : win,
    unit: s.unit,
    headline: combine(win, s.agg),
    headlineLabel,
    delta,
    meta: `${range} · ${tile.grain === 'weekly' ? L.weekly : L.daily}`,
  };
}

function followUpsFor(tile: Tile): { action: FollowUp; label: string }[] {
  const f = C.followUps;
  if (tile.split)
    return [
      { action: 'sorted', label: tile.sorted ? f.unsort : f.sort },
      { action: 'recent', label: tile.recent ? f.every : f.top },
    ];
  const range = { action: 'recent' as const, label: tile.recent ? f.all : f.recent };
  return tile.kind === 'kpi' ? [range] : [{ action: 'grain', label: tile.grain === 'daily' ? f.weekly : f.daily }, range];
}

/** What a screen reader hears for a tile: the same numbers the chart draws. */
function describe(tile: Tile, v: View): string {
  if (v.labels) return `${v.labels.map((l, i) => `${l} ${full[v.unit](v.values[i]!)}`).join(', ')}. ${L.total} ${full[v.unit](v.headline)}.`;
  const change = `${v.delta >= 0 ? 'Up' : 'Down'} ${Math.abs(v.delta * 100).toFixed(1)}% ${L.versus}`;
  if (tile.kind === 'kpi') return `${full[v.unit](v.headline)}, ${v.meta}. ${change}.`;
  return `${tile.kind} chart, ${v.meta}. ${v.headlineLabel} ${full[v.unit](v.headline)}. ${change}.`;
}

/* ------------------------------------------------------------------ */
/* One tile                                                             */
/* ------------------------------------------------------------------ */

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30, mass: 0.9 };
const KINDS: ChartKind[] = ['bar', 'line', 'area'];

type TileProps = {
  tile: Tile;
  view: View;
  index: number;
  count: number;
  editable: boolean;
  reduced: boolean;
  onPatch: (id: string, patch: Partial<Tile>) => void;
  onMove: (id: string, by: number) => void;
  onDrop: (id: string, x: number, y: number) => void;
  onFollowUp: (id: string, action: FollowUp, label: string) => void;
};

function TileCard({ tile, view, index, count, editable, reduced, onPatch, onMove, onDrop, onFollowUp }: TileProps) {
  const controls = useDragControls();
  const [asking, setAsking] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const firstOption = useRef<HTMLButtonElement>(null);
  const resize = useRef<number | null>(null);
  const isKpi = tile.kind === 'kpi';
  const canDrag = editable && !reduced;
  // A line drawn across categories would imply an order that is not there, so only time series can be retyped.
  const canRetype = !isKpi && !tile.split;
  const followUps = followUpsFor(tile);
  const up = view.delta >= 0;

  useEffect(() => {
    if (asking) firstOption.current?.focus();
  }, [asking]);
  const closeAsk = () => {
    setAsking(false);
    trigger.current?.focus();
  };

  return (
    <motion.li
      layout={!reduced}
      data-tile={tile.id}
      data-span={tile.span}
      data-kind={isKpi ? 'kpi' : 'chart'}
      className="ayd-tile"
      style={{ borderRadius: 10 }}
      initial={reduced ? false : { opacity: 0, scale: 0.9, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : SPRING}
      drag={canDrag}
      dragControls={controls}
      dragListener={false}
      dragSnapToOrigin
      dragElastic={0.7}
      whileDrag={{ scale: 1.03, zIndex: 20, boxShadow: '0 18px 40px rgb(0 0 0 / 0.45)' }}
      onDragEnd={(_e, info: PanInfo) => onDrop(tile.id, info.point.x - window.scrollX, info.point.y - window.scrollY)}
    >
      <motion.div
        layout={reduced ? false : 'position'}
        className="ayd-head"
        data-drag={canDrag ? '' : undefined}
        data-cursor={canDrag ? L.drag : undefined}
        onPointerDown={(e) => {
          if (canDrag) controls.start(e);
        }}
      >
        <h3 className="text-label truncate text-mute">
          {canDrag ? (
            <span aria-hidden="true" className="ayd-grip">
              ⠿
            </span>
          ) : null}
          {tile.title}
        </h3>
        {isKpi ? null : <span className="ayd-meta">{view.meta}</span>}
      </motion.div>

      <p className="sr-only">{describe(tile, view)}</p>

      {isKpi ? (
        <motion.div layout={reduced ? false : 'position'} className="ayd-body" aria-hidden="true">
          <p className="ayd-kpi">
            <Num value={view.headline} format={full[view.unit]} />
          </p>
          <div className="ayd-plot ayd-spark" data-busy={tile.busy ? '' : undefined}>
            <Chart values={view.values} kind="line" className="absolute inset-0 h-full w-full" />
          </div>
          <p className={`truncate font-mono text-xs ${up ? 'text-ok' : 'text-bad'}`}>
            {up ? '▲' : '▼'} <Num value={Math.abs(view.delta * 100)} format={pct1} />
            <span className="ml-2 text-mute">{view.meta}</span>
          </p>
        </motion.div>
      ) : (
        <div className="ayd-body" aria-hidden="true">
          <motion.div layout={!reduced} className="ayd-plot" data-busy={tile.busy ? '' : undefined}>
            <Chart values={view.values} kind={tile.kind as ChartKind} className="absolute inset-0 h-full w-full" />
          </motion.div>
          <motion.div layout={reduced ? false : 'position'}>
            {view.labels ? (
              <ul className="ayd-cats" style={{ gridTemplateColumns: `repeat(${view.labels.length}, minmax(0, 1fr))` }}>
                {view.labels.map((label, i) => (
                  <li key={label}>
                    <span className="text-fg">{short[view.unit](view.values[i]!)}</span>
                    <span className="truncate">{label}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ayd-foot">
                <span>{view.headlineLabel}</span>
                <Num value={view.headline} format={short[view.unit]} className="text-fg" />
              </p>
            )}
          </motion.div>
        </div>
      )}

      {tile.busy ? (
        <p className="ayd-reprompt">
          <span aria-hidden="true">›</span> {tile.busy}
          <span className="ayd-shimmer" aria-hidden="true" />
        </p>
      ) : null}

      {editable ? (
        <div className="ayd-tools" role="group" aria-label={`${L.edit}: ${tile.title}`}>
          <button type="button" className="ayd-btn" disabled={index === 0} onClick={() => onMove(tile.id, -1)} aria-label={`${L.moveEarlier}: ${tile.title}`}>
            ←
          </button>
          <button type="button" className="ayd-btn" disabled={index === count - 1} onClick={() => onMove(tile.id, 1)} aria-label={`${L.moveLater}: ${tile.title}`}>
            →
          </button>
          <button
            type="button"
            className="ayd-btn"
            onClick={() => onPatch(tile.id, { span: tile.span === 2 ? 1 : 2 })}
            aria-label={`${tile.span === 2 ? L.narrower : L.wider}: ${tile.title}`}
          >
            {tile.span === 2 ? '→←' : '←→'}
          </button>
          {canRetype ? (
            <span role="group" aria-label={`${L.chartType}: ${tile.title}`} className="ayd-segs">
              {KINDS.map((k) => (
                <button key={k} type="button" className="ayd-btn" aria-pressed={tile.kind === k} onClick={() => onPatch(tile.id, { kind: k })}>
                  {k}
                </button>
              ))}
            </span>
          ) : null}
          <button ref={trigger} type="button" className="ayd-btn ayd-btn-ask" aria-expanded={asking} onClick={() => setAsking(true)}>
            <span aria-hidden="true">›_</span> {L.followUp}
          </button>
        </div>
      ) : null}

      {asking && editable ? (
        <div
          className="ayd-ask"
          role="group"
          aria-label={`${L.followUp}: ${tile.title}`}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              closeAsk();
            }
          }}
        >
          <p className="text-caption truncate">{L.followUpHint}</p>
          {followUps.map((f, i) => (
            <button
              key={f.action}
              ref={i === 0 ? firstOption : undefined}
              type="button"
              className="ayd-follow"
              onClick={() => {
                closeAsk();
                onFollowUp(tile.id, f.action, f.label);
              }}
            >
              <span aria-hidden="true" className="text-tint">
                ›
              </span>
              {f.label}
            </button>
          ))}
          <button type="button" className="ayd-btn ayd-ask-close" onClick={closeAsk} aria-label={L.close}>
            ✕
          </button>
        </div>
      ) : null}

      {canDrag ? (
        <span
          aria-hidden="true"
          className="ayd-resize"
          data-cursor={L.resize}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            resize.current = e.clientX;
          }}
          onPointerMove={(e) => {
            if (resize.current === null) return;
            const dx = e.clientX - resize.current;
            if ((dx > 40 && tile.span === 1) || (dx < -40 && tile.span === 2)) {
              resize.current = e.clientX;
              onPatch(tile.id, { span: tile.span === 1 ? 2 : 1 });
            }
          }}
          onPointerUp={() => {
            resize.current = null;
          }}
          onPointerCancel={() => {
            resize.current = null;
          }}
        />
      ) : null}
    </motion.li>
  );
}

/* ------------------------------------------------------------------ */
/* The streamed plan + SQL shown while the build runs                   */
/* ------------------------------------------------------------------ */

function Stream({ lines, chars }: { lines: Token[][]; chars: number }) {
  let left = chars;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < lines.length && left > 0; i++) {
    const row: React.ReactNode[] = [];
    for (let j = 0; j < lines[i]!.length && left > 0; j++) {
      const tok = lines[i]![j]!;
      const text = tok.v.slice(0, left);
      left -= text.length;
      row.push(
        <span key={j} className={`tok-${tok.t}`}>
          {text}
        </span>,
      );
    }
    left -= 1; // the line break
    const last = left <= 0 || i === lines.length - 1;
    out.push(
      <span key={i} className="block min-h-[1.6em] whitespace-pre">
        {row}
        {last ? <span className="ayd-caret" /> : null}
      </span>,
    );
  }
  return (
    <div className="ayd-stream" aria-hidden="true">
      <pre className="code text-xs leading-[1.6]">{out.length ? out : <span className="ayd-caret" />}</pre>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The module                                                           */
/* ------------------------------------------------------------------ */

type Phase = 'idle' | 'running' | 'done';

/** The build lasts 7.5s on screen and is labelled as a time-lapse of about 30 seconds. */
const RUN_SECONDS = 7.5;
const SHOWN_SECONDS = 30;
/** When each pipeline stage lights up, as a fraction of the run. */
const STAGE_AT = [0, 0.1, 0.4, 0.6, 0.78];
const PLAN = [0.12, 0.38] as const;
const SQL = [0.4, 0.58] as const;
const FIRST_TILE = 0.62;
const TILE_EVERY = 0.075;
const part = (t: number, [a, b]: readonly [number, number]) => Math.min(1, Math.max(0, (t - a) / (b - a)));

export default function AskYourData({ step, pinned, goTo }: ModuleProps) {
  const reduced = useReducedMotion();
  const inputId = useId();
  const input = useRef<HTMLTextAreaElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const run = useRef<gsap.core.Tween | null>(null);
  const typing = useRef<gsap.core.Tween | null>(null);
  const timers = useRef<number[]>([]);
  const [presetIndex, setPresetIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [stage, setStage] = useState(-1);
  const [shown, setShown] = useState(0);
  const [chars, setChars] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>(() => C.presets[0]!.tiles.map(toTile));
  const preset: AskPreset = C.presets[presetIndex]!;

  const data = useMemo(() => new Map(preset.series.map((s) => [s.id, daily(s)])), [preset]);
  const stream = useMemo(() => {
    const plan = [`-- ${L.plan}: ${preset.tiles.length} tiles`, ...preset.tiles.map((t) => `--   ${t.kind.padEnd(5)} ${t.title}`)].join('\n');
    return { lines: highlight(`${plan}\n${preset.sql}`, 'sql'), planLen: plan.length + 1, sqlLen: preset.sql.length };
  }, [preset]);

  const setClock = (seconds: number) => {
    if (clock.current) clock.current.textContent = `00:${seconds.toFixed(1).padStart(4, '0')}`;
  };

  // In the unpinned layout the chapters are buttons, so the demo keeps them in step with itself.
  // When the section is pinned, scroll owns the chapter and the demo never moves the page.
  const sync = useCallback(
    (i: number) => {
      if (!pinned) goTo(i);
    },
    [pinned, goTo],
  );

  const finish = useCallback(() => {
    run.current?.kill();
    run.current = null;
    setClock(SHOWN_SECONDS);
    setStage(C.stages.length - 1);
    setShown(preset.tiles.length);
    setPhase('done');
    sync(3);
  }, [preset, sync]);

  const reset = useCallback(() => {
    run.current?.kill();
    run.current = null;
    setClock(0);
    setPhase('idle');
    setStage(-1);
    setShown(0);
    setChars(0);
  }, []);

  const start = useCallback(() => {
    typing.current?.progress(1);
    run.current?.kill();
    setTiles(preset.tiles.map(toTile));
    setShown(0);
    setChars(0);
    setStage(0);
    setPhase('running');
    if (reduced) {
      finish();
      return;
    }
    sync(1);
    const o = { t: 0 };
    let lastStage = 0;
    let lastShown = 0;
    let lastChars = 0;
    run.current = gsap.to(o, {
      t: 1,
      duration: RUN_SECONDS,
      ease: 'none',
      overwrite: false,
      onUpdate: () => {
        setClock(o.t * SHOWN_SECONDS);
        let s = 0;
        for (let i = 0; i < STAGE_AT.length; i++) if (o.t >= STAGE_AT[i]!) s = i;
        if (s !== lastStage) {
          lastStage = s;
          setStage(s);
        }
        const n = o.t < FIRST_TILE ? 0 : Math.min(preset.tiles.length, 1 + Math.floor((o.t - FIRST_TILE) / TILE_EVERY));
        if (n !== lastShown) {
          if (lastShown === 0) sync(2);
          lastShown = n;
          setShown(n);
        }
        if (n === 0) {
          // Type the plan, then the SQL. Three characters at a time keeps React renders low.
          const c = Math.floor((stream.planLen * part(o.t, PLAN) + stream.sqlLen * part(o.t, SQL)) / 3) * 3;
          if (c !== lastChars) {
            lastChars = c;
            setChars(c);
          }
        }
      },
      onComplete: finish,
    });
  }, [preset, reduced, finish, sync, stream]);

  const choose = (i: number) => {
    typing.current?.kill();
    reset();
    setPresetIndex(i);
    sync(0);
    const text = C.presets[i]!.prompt;
    const el = input.current;
    if (!el) return;
    if (reduced) {
      el.value = text;
      return;
    }
    const o = { n: 0 };
    typing.current = gsap.to(o, {
      n: text.length,
      duration: Math.min(1, text.length / 80),
      ease: 'none',
      overwrite: false,
      onUpdate: () => {
        el.value = text.slice(0, Math.round(o.n));
      },
    });
  };

  // The chapters drive the demo: leaving "Ask" starts the build and "Edit" makes sure it has finished.
  // Where the chapters are buttons (unpinned), tapping "Ask" clears the stage. When scroll drives them,
  // scrolling back never wipes a dashboard the reader may have edited: "Run again" does that.
  // The latest values are read through a ref so that this effect only ever reacts to the chapter changing.
  const live = useRef({ phase, pinned, start, finish, reset });
  useEffect(() => {
    live.current = { phase, pinned, start, finish, reset };
  });
  const lastStep = useRef<number | null>(null);
  useEffect(() => {
    const was = lastStep.current;
    lastStep.current = step;
    const now = live.current;
    if (was === null) {
      // Mounted part-way through the section (deep link, restored scroll): catch up.
      if (step >= 3) now.finish();
      else if (step >= 1) now.start();
      return;
    }
    if (step === 0 && was > 0 && !now.pinned) now.reset();
    else if (step >= 1 && now.phase === 'idle') now.start();
    else if (step >= 3 && now.phase === 'running') now.finish();
  }, [step]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      run.current?.kill();
      typing.current?.kill();
      pending.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const patch = useCallback((id: string, p: Partial<Tile>) => setTiles((ts) => ts.map((t) => (t.id === id ? { ...t, ...p } : t))), []);

  const move = useCallback((id: string, by: number) => {
    setTiles((ts) => {
      const i = ts.findIndex((t) => t.id === id);
      const j = i + by;
      if (i < 0 || j < 0 || j >= ts.length) return ts;
      const next = [...ts];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  }, []);

  const drop = useCallback((id: string, x: number, y: number) => {
    const target = document
      .elementsFromPoint(x, y)
      .map((el) => el.closest<HTMLElement>('[data-tile]')?.dataset.tile)
      .find((other) => other && other !== id);
    if (!target) return;
    setTiles((ts) => {
      const from = ts.findIndex((t) => t.id === id);
      const to = ts.findIndex((t) => t.id === target);
      if (from < 0 || to < 0) return ts;
      const next = [...ts];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item!);
      return next;
    });
  }, []);

  const followUp = useCallback(
    (id: string, action: FollowUp, label: string) => {
      const apply = () =>
        setTiles((ts) =>
          ts.map((t) => {
            if (t.id !== id) return t;
            if (action === 'grain') return { ...t, busy: null, grain: t.grain === 'weekly' ? 'daily' : 'weekly' };
            if (action === 'recent') return { ...t, busy: null, recent: !t.recent };
            return { ...t, busy: null, sorted: !t.sorted };
          }),
        );
      if (reduced) {
        apply();
        return;
      }
      patch(id, { busy: label });
      timers.current.push(window.setTimeout(apply, 850));
    },
    [patch, reduced],
  );

  const visible = phase === 'idle' ? [] : tiles.slice(0, shown);
  const status =
    phase === 'idle'
      ? C.status.idle
      : phase === 'running'
        ? `${C.status.running[Math.max(0, Math.min(stage, C.status.running.length - 1))]}…`
        : `${C.status.done} ${pinned ? C.status.donePointer : ''}`.trim();

  return (
    <div className="ayd" data-pinned={pinned ? '' : undefined}>
      <form
        className="ayd-prompt"
        onSubmit={(e) => {
          e.preventDefault();
          start();
        }}
      >
        <span aria-hidden="true" className="font-mono text-tint">
          ›
        </span>
        <label htmlFor={inputId} className="sr-only">
          {L.promptLabel}
        </label>
        <textarea
          ref={input}
          id={inputId}
          readOnly
          rows={2}
          defaultValue={preset.prompt}
          className="ayd-input"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (phase !== 'running') start();
            }
          }}
        />
        <button type="submit" className="btn btn-sm btn-solid flex-none" disabled={phase === 'running'}>
          {phase === 'running' ? L.running : phase === 'done' ? L.rerun : L.run}
          <span aria-hidden="true">↵</span>
        </button>
      </form>

      <div role="group" aria-label={L.presets} className="flex flex-wrap gap-1.5">
        {C.presets.map((p, i) => (
          <button key={p.id} type="button" className="ayd-chip" aria-pressed={i === presetIndex} onClick={() => choose(i)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="ayd-rail">
        <ol className="ayd-stages" aria-label={L.pipeline}>
          {C.stages.map((s, i) => (
            <li
              key={s}
              className="ayd-stage"
              data-on={stage >= i ? '' : undefined}
              data-active={phase === 'running' && stage === i ? '' : undefined}
              aria-current={phase === 'running' && stage === i ? 'step' : undefined}
            >
              <span className="ayd-dot" aria-hidden="true" />
              <span className="ayd-stage-label">{s}</span>
            </li>
          ))}
        </ol>
        <p className="flex flex-none items-baseline gap-2 font-mono text-xs">
          <span ref={clock} className="tnum text-sm text-fg">
            00:00.0
          </span>
          <span className="text-mute">{L.timelapse}</span>
        </p>
      </div>

      <p className="text-caption ayd-status" aria-live="polite">
        {`// ${status}`}
      </p>

      {phase === 'idle' ? (
        <div className="ayd-empty">
          <p className="text-caption px-6 text-center">{L.empty}</p>
        </div>
      ) : visible.length === 0 ? (
        <Stream lines={stream.lines} chars={chars} />
      ) : (
        <ul className="ayd-grid" aria-label={L.dashboard}>
          {visible.map((t, i) => (
            <TileCard
              key={`${preset.id}-${t.id}`}
              tile={t}
              view={viewOf(t, preset, data)}
              index={i}
              count={visible.length}
              editable={phase === 'done'}
              reduced={reduced}
              onPatch={patch}
              onMove={move}
              onDrop={drop}
              onFollowUp={followUp}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
