/**
 * Quality settings for the WebGL stage. Tune these to trade fidelity for frame rate.
 *
 * The engine starts at a tier chosen from the device, measures real frame time, and steps
 * down (or back up) automatically. Force a tier with ?quality=0..3 in the URL.
 */

export type Tier = {
  /** Particle texture side: particles = side². */
  particles: number;
  /** Fluid simulation resolution on the short side. 0 disables the fluid. */
  fluid: number;
  /** Pressure solver iterations. */
  pressure: number;
  /** Device pixel ratio cap. */
  dpr: number;
  bloom: boolean;
  /** Point size multiplier (fewer particles are drawn larger). */
  pointScale: number;
};

export const TIERS: Tier[] = [
  { particles: 96, fluid: 0, pressure: 0, dpr: 1, bloom: false, pointScale: 1.7 },
  { particles: 128, fluid: 0, pressure: 0, dpr: 1, bloom: true, pointScale: 1.45 },
  { particles: 192, fluid: 112, pressure: 10, dpr: 1.25, bloom: true, pointScale: 1.15 },
  { particles: 256, fluid: 160, pressure: 14, dpr: 1.5, bloom: true, pointScale: 1 },
];

/** Hard cap from the brief: never render above 1.5x. */
export const MAX_DPR = 1.5;

export const ADAPT = {
  /** Step down when the smoothed frame time stays above this (ms)… */
  slowMs: 21,
  /** …for this many consecutive frames. */
  slowFrames: 75,
  /** Step back up when the smoothed frame time stays below this (ms)… */
  fastMs: 11.5,
  /** …for this many consecutive frames. */
  fastFrames: 900,
  /** Ignore the first frames after start or a tier change (shader compile, layout). */
  settleFrames: 45,
} as const;

export function initialTier(): number {
  if (typeof window === 'undefined') return 2;
  const forced = new URLSearchParams(window.location.search).get('quality');
  if (forced !== null && /^[0-3]$/.test(forced)) return Number(forced);
  const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowMem = (nav.deviceMemory ?? 8) <= 4;
  const fewCores = (navigator.hardwareConcurrency ?? 8) <= 4;
  // Touch devices: reduced particles, no fluid simulation.
  if (coarse || small) return lowMem || fewCores ? 0 : 1;
  if (lowMem || fewCores) return 2;
  return 3;
}

/** The highest tier this device may adapt up to. Touch devices never get the fluid. */
export function maxTier(): number {
  if (typeof window === 'undefined') return 2;
  const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  return coarse ? 1 : 3;
}

export function isForcedTier(): boolean {
  if (typeof window === 'undefined') return false;
  return /^[0-3]$/.test(new URLSearchParams(window.location.search).get('quality') ?? '');
}
