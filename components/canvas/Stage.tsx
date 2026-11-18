'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { useApp } from '@/lib/store';
import { initialTier } from '@/lib/quality';
import { onIdle } from '@/lib/idle';

function hasWebGL2(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
    const ok = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

/**
 * The persistent stage. Mounted once in the root layout, so the signal never resets between routes.
 * Real content paints first: the WebGL bundle is loaded after hydration, and a CSS gradient stands in
 * until it is ready (or forever, if WebGL is unavailable).
 */
export function Stage() {
  const [Canvas, setCanvas] = useState<ComponentType | null>(null);

  useEffect(() => {
    const app = useApp.getState();
    // Tells the boot script's failsafe that the app is alive.
    (window as Window & { __hs?: boolean }).__hs = true;
    // If hydration was slow enough for the failsafe to fire, take the flag back.
    document.documentElement.setAttribute('data-js', '');
    app.report('hydrate', 1);
    document.fonts.ready.then(() => useApp.getState().report('fonts', 1));

    if (new URLSearchParams(window.location.search).has('nogl') || !hasWebGL2()) {
      app.setGl('off');
      app.report('chunk', 1);
      app.report('frame', 1);
      return;
    }
    app.setTier(initialTier());

    let cancelled = false;
    const load = () => {
      import('./SignalCanvas')
        .then((m) => {
          if (cancelled) return;
          useApp.getState().report('chunk', 1);
          setCanvas(() => m.default);
        })
        .catch(() => {
          const a = useApp.getState();
          a.setGl('off');
          a.report('chunk', 1);
          a.report('frame', 1);
        });
    };
    // Let the first paint and hydration finish before parsing three.js.
    const cancel = onIdle(load, 600);
    return () => {
      cancelled = true;
      cancel();
    };
  }, []);

  return (
    <div id="stage" aria-hidden="true">
      <div className="stage-fallback" />
      <div className="grain" />
      {Canvas ? <Canvas /> : null}
    </div>
  );
}
