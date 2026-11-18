export const clamp = (v: number, min = 0, max = 1): number => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const invLerp = (a: number, b: number, v: number): number => (a === b ? 0 : (v - a) / (b - a));
export const smoothstep = (a: number, b: number, v: number): number => {
  const t = clamp(invLerp(a, b, v));
  return t * t * (3 - 2 * t);
};
/** Frame-rate independent damping. */
export const damp = (current: number, target: number, lambda: number, dt: number): number =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

/** Hex (#rrggbb) to linear-ish 0..1 rgb triple (sRGB values; the shaders work in display space). */
export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Deterministic PRNG (mulberry32). All synthetic data on the site is generated from fixed seeds. */
export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const formatInt = (n: number): string => Math.round(n).toLocaleString('en-GB');
export const formatGBP = (n: number, digits = 0): string =>
  `£${n.toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
export const formatCompact = (n: number): string =>
  Math.abs(n) >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}m`
    : Math.abs(n) >= 10_000
      ? `${(n / 1000).toFixed(1)}k`
      : formatInt(n);
export const formatPct = (n: number, digits = 1): string => `${(n * 100).toFixed(digits)}%`;

export const isBrowser = typeof window !== 'undefined';

export function prefersReducedMotion(): boolean {
  return isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isCoarsePointer(): boolean {
  return isBrowser && window.matchMedia('(hover: none), (pointer: coarse)').matches;
}

/** Strip the [EDIT …] markers from a string (for metadata, alt text and aria labels). */
export function stripEdits(text: string): string {
  return text
    .replace(/\s*\[EDIT[^\]]*\]\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
