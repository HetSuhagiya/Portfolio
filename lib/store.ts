'use client';

import { create } from 'zustand';

export type TransitionPhase = 'idle' | 'exit' | 'swap' | 'enter';
export type GlStatus = 'pending' | 'on' | 'off';

type AppState = {
  /** True once the preloader has finished (or was skipped). Hero reveals wait for this. */
  preloaded: boolean;
  /** Route transition phase. */
  phase: TransitionPhase;
  /** How the current page was reached. */
  nav: 'initial' | 'push' | 'pop';
  menuOpen: boolean;
  gl: GlStatus;
  /** WebGL posters are being drawn (desktop + WebGL). */
  glPosters: boolean;
  /** Adaptive quality tier, 0 (lowest) to 3. */
  tier: number;
  /** Asset-aware preload progress, 0..1. */
  progress: Record<string, number>;
  setPreloaded: () => void;
  setPhase: (phase: TransitionPhase) => void;
  setNav: (nav: AppState['nav']) => void;
  setMenu: (open: boolean) => void;
  setGl: (gl: GlStatus) => void;
  setGlPosters: (on: boolean) => void;
  setTier: (tier: number) => void;
  report: (key: string, value: number) => void;
};

export const useApp = create<AppState>((set) => ({
  preloaded: false,
  phase: 'idle',
  nav: 'initial',
  menuOpen: false,
  gl: 'pending',
  glPosters: false,
  tier: 2,
  progress: { hydrate: 0, fonts: 0, chunk: 0, frame: 0 },
  setPreloaded: () => set({ preloaded: true }),
  setPhase: (phase) => set({ phase }),
  setNav: (nav) => set({ nav }),
  setMenu: (menuOpen) => set({ menuOpen }),
  setGl: (gl) => {
    if (typeof document !== 'undefined') document.documentElement.dataset.gl = gl;
    set({ gl });
  },
  setGlPosters: (glPosters) => {
    if (typeof document !== 'undefined') document.documentElement.dataset.glPosters = glPosters ? 'on' : 'off';
    set({ glPosters });
  },
  setTier: (tier) => set({ tier }),
  report: (key, value) => set((s) => ({ progress: { ...s.progress, [key]: value } })),
}));

/** Weights for the preloader: what "loaded" is made of. */
export const PROGRESS_WEIGHTS: Record<string, number> = { hydrate: 0.15, fonts: 0.25, chunk: 0.35, frame: 0.25 };

export function totalProgress(p: Record<string, number>): number {
  let t = 0;
  for (const [k, w] of Object.entries(PROGRESS_WEIGHTS)) t += (p[k] ?? 0) * w;
  return t;
}
