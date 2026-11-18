/**
 * The signal store.
 *
 * One persistent particle thread lives in the root layout. Routes and scroll scenes never touch
 * the canvas directly: they describe a "signal state" here, and the engine morphs toward it.
 *
 *   setSignal(preset)          a route (or section) registers its resting state
 *   blendSignal(from, to, t)   a scrubbed scene blends two states by scroll progress
 *   releaseSignal()            hand control back to the resting state
 *   wipe()                     the page-transition sweep
 */
import { createStore } from 'zustand/vanilla';
import type { SignalLayout, SignalPreset } from '@/content/types';
import { hexToRgb, lerp } from './utils';

export const LAYOUTS: SignalLayout[] = [
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
];

export const SIGNAL_DEFAULTS = {
  accent: 0,
  turbulence: 0.15,
  flow: 0.3,
  spread: 0.4,
  param: 1,
  x: 0,
  y: 0,
  scale: 1,
  fluid: 1,
  intensity: 1,
} as const;

export const SIGNAL_COLOR = '#5CF2D6';
export const DECISION_COLOR = '#FFB547';

/** Named presets shared by pages and scenes. */
export const PRESETS = {
  noise: { layout: 'noise', color: SIGNAL_COLOR, turbulence: 0.9, flow: 0.2, intensity: 0.75 },
  thread: { layout: 'thread', color: SIGNAL_COLOR, turbulence: 0.14, flow: 0.32, spread: 0.45, y: -0.04 },
  merge: { layout: 'merge', color: SIGNAL_COLOR, turbulence: 0.1, flow: 0.4, spread: 0.4 },
  grid: { layout: 'grid', color: SIGNAL_COLOR, turbulence: 0.03, flow: 0.2, spread: 0.3, intensity: 0.8 },
  bars: { layout: 'bars', color: SIGNAL_COLOR, accent: 1, turbulence: 0.05, flow: 0.2, spread: 0.3 },
  index: { layout: 'grid', color: SIGNAL_COLOR, turbulence: 0.04, flow: 0.15, spread: 0.2, intensity: 0.45 },
  about: { layout: 'noise', color: SIGNAL_COLOR, turbulence: 0.7, flow: 0.2, intensity: 0.6 },
  resume: { layout: 'thread', color: '#1B2A4A', turbulence: 0.03, flow: 0.06, spread: 0.15, y: 0.72, intensity: 0.6, fluid: 0.4 },
  contact: { layout: 'point', color: SIGNAL_COLOR, accent: 1, turbulence: 0.12, flow: 0.3, x: 0.55, y: 0.05 },
  lost: { layout: 'broken', color: SIGNAL_COLOR, turbulence: 0.35, flow: 0.3, spread: 0.6, param: 1 },
  found: { layout: 'broken', color: SIGNAL_COLOR, turbulence: 0.12, flow: 0.3, spread: 0.45, param: 0 },
  menu: { layout: 'thread', color: SIGNAL_COLOR, turbulence: 0.3, flow: 0.5, spread: 0.7, y: 0.78, intensity: 0.7 },
} satisfies Record<string, SignalPreset>;

export type SignalValues = {
  layout: number;
  rgb: [number, number, number];
  accent: number;
  turbulence: number;
  flow: number;
  spread: number;
  param: number;
  x: number;
  y: number;
  scale: number;
  fluid: number;
  intensity: number;
};

const NUMERIC = ['accent', 'turbulence', 'flow', 'spread', 'param', 'x', 'y', 'scale', 'fluid', 'intensity'] as const;

export function resolvePreset(p: SignalPreset): SignalValues {
  return {
    layout: Math.max(0, LAYOUTS.indexOf(p.layout)),
    rgb: hexToRgb(p.color),
    accent: p.accent ?? SIGNAL_DEFAULTS.accent,
    turbulence: p.turbulence ?? SIGNAL_DEFAULTS.turbulence,
    flow: p.flow ?? SIGNAL_DEFAULTS.flow,
    spread: p.spread ?? SIGNAL_DEFAULTS.spread,
    param: p.param ?? SIGNAL_DEFAULTS.param,
    x: p.x ?? SIGNAL_DEFAULTS.x,
    y: p.y ?? SIGNAL_DEFAULTS.y,
    scale: p.scale ?? SIGNAL_DEFAULTS.scale,
    fluid: p.fluid ?? SIGNAL_DEFAULTS.fluid,
    intensity: p.intensity ?? SIGNAL_DEFAULTS.intensity,
  };
}

export function mixValues(a: SignalValues, b: SignalValues, t: number): SignalValues {
  const out = { ...a, rgb: [...a.rgb] as [number, number, number] };
  for (const k of NUMERIC) out[k] = lerp(a[k], b[k], t);
  out.rgb = [lerp(a.rgb[0], b.rgb[0], t), lerp(a.rgb[1], b.rgb[1], t), lerp(a.rgb[2], b.rgb[2], t)];
  return out;
}

type Scrub = { from: SignalValues; to: SignalValues; t: number; owner: string };

export type SignalStore = {
  /** Resting state of the current route / section. */
  base: SignalValues;
  /** While set, a scroll scene is blending two states. */
  scrub: Scrub | null;
  /** Page-transition sweep. `at` is a performance.now() timestamp; 0 means idle. */
  wipe: { at: number; duration: number; dir: 1 | -1 };
  /** Paper theme: the thread is drawn as ink. */
  paper: boolean;
};

export const signalStore = createStore<SignalStore>(() => ({
  base: resolvePreset(PRESETS.noise),
  scrub: null,
  wipe: { at: 0, duration: 1100, dir: 1 },
  paper: false,
}));

export function setSignal(preset: SignalPreset): void {
  signalStore.setState({ base: resolvePreset(preset) });
}

/** Patch the resting state without replacing it (for example, closing the 404 gap). */
export function patchSignal(patch: Partial<Omit<SignalPreset, 'layout' | 'color'>>): void {
  const base = { ...signalStore.getState().base };
  for (const k of NUMERIC) {
    const v = patch[k];
    if (typeof v === 'number') base[k] = v;
  }
  signalStore.setState({ base });
}

const cache = new WeakMap<SignalPreset, SignalValues>();
const resolved = (p: SignalPreset): SignalValues => {
  let v = cache.get(p);
  if (!v) {
    v = resolvePreset(p);
    cache.set(p, v);
  }
  return v;
};

/** Blend two presets by progress t (0..1). `owner` identifies the scene, so only it can release. */
export function blendSignal(owner: string, from: SignalPreset, to: SignalPreset, t: number): void {
  signalStore.setState({ scrub: { owner, from: resolved(from), to: resolved(to), t } });
}

/** The scrub a temporary owner (the "next" footer) took over from, restored when it lets go. */
let underlay: Scrub | null = null;

/**
 * Blend from whatever is on screen toward another preset (used by the "next" footer).
 * If a scene is mid-scrub, its current state is frozen and used as the starting point.
 */
export function blendToward(owner: string, to: SignalPreset, t: number): void {
  const st = signalStore.getState();
  let from: SignalValues;
  if (st.scrub && st.scrub.owner === owner) {
    from = st.scrub.from;
  } else if (st.scrub) {
    underlay = st.scrub;
    const s = st.scrub;
    from = { ...mixValues(s.from, s.to, s.t), layout: s.t > 0.5 ? s.to.layout : s.from.layout };
  } else {
    underlay = null;
    from = st.base;
  }
  signalStore.setState({ scrub: { owner, from, to: resolved(to), t } });
}

export function releaseSignal(owner: string): void {
  const s = signalStore.getState().scrub;
  if (!s || s.owner !== owner) return;
  signalStore.setState({ scrub: underlay && underlay.owner !== owner ? underlay : null });
  underlay = null;
}

/** Drop every scrub (route changes). */
export function clearScrub(): void {
  underlay = null;
  signalStore.setState({ scrub: null });
}

export function wipe(dir: 1 | -1 = 1, duration = 1100): void {
  signalStore.setState({ wipe: { at: performance.now(), duration, dir } });
}

export function setPaper(paper: boolean): void {
  if (signalStore.getState().paper !== paper) signalStore.setState({ paper });
}
