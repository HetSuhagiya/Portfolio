'use client';

import { useSyncExternalStore } from 'react';

/** Subscribe to a media query. Returns `fallback` on the server and during hydration. */
export function useMedia(query: string, fallback = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}

export const useReducedMotion = (): boolean => useMedia('(prefers-reduced-motion: reduce)');
export const useCoarsePointer = (): boolean => useMedia('(hover: none), (pointer: coarse)');
