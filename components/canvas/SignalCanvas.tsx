'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, advance, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { gsap } from '@/lib/gsap';
import { Engine } from './engine/engine';
import { useApp } from '@/lib/store';
import { MAX_DPR, TIERS, isForcedTier, maxTier } from '@/lib/quality';
import { attachPointer } from '@/lib/pointer';
import { isCoarsePointer, prefersReducedMotion } from '@/lib/utils';

function Rig({ reduced, posters }: { reduced: boolean; posters: boolean }) {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const tier = useApp((s) => s.tier);
  const engine = useRef<Engine | null>(null);

  useEffect(() => {
    const app = useApp.getState();
    const e = new Engine(gl, { posters, reducedMotion: reduced });
    if (!e.ok) {
      app.setGl('off');
      app.report('frame', 1);
      e.dispose();
      return;
    }
    e.onFirstFrame = () => {
      const a = useApp.getState();
      a.setGl('on');
      a.report('frame', 1);
      if (posters) a.setGlPosters(true);
    };
    e.setTier(useApp.getState().tier);
    engine.current = e;

    const canvas = gl.domElement;
    const lost = (ev: Event) => {
      ev.preventDefault();
      useApp.getState().setGl('off');
      useApp.getState().setGlPosters(false);
    };
    canvas.addEventListener('webglcontextlost', lost);
    return () => {
      canvas.removeEventListener('webglcontextlost', lost);
      engine.current = null;
      e.dispose();
    };
  }, [gl, posters, reduced]);

  useEffect(() => {
    engine.current?.setTier(tier);
  }, [tier]);

  useEffect(() => {
    engine.current?.resize(size.width, size.height, dpr);
  }, [size.width, size.height, dpr]);

  // Priority 1 takes over rendering from R3F: the engine draws the frame itself.
  useFrame((_, delta) => {
    engine.current?.frame(delta);
  }, 1);

  return null;
}

/** Adaptive quality: step the tier down (or back up) from measured frame rate. */
function Adaptive() {
  const locked = useRef(false);
  const settle = useRef(0);
  if (isForcedTier()) return null;
  const change = (dir: 1 | -1) => {
    if (locked.current || performance.now() < settle.current) return;
    const { tier, setTier } = useApp.getState();
    const next = Math.min(maxTier(), Math.max(0, tier + dir));
    if (next !== tier) {
      setTier(next);
      settle.current = performance.now() + 2500;
    }
  };
  return (
    <PerformanceMonitor
      ms={250}
      iterations={8}
      threshold={0.75}
      bounds={(hz) => (hz > 100 ? [55, 108] : [46, 58])}
      flipflops={3}
      onDecline={() => change(-1)}
      onIncline={() => change(1)}
      onFallback={() => {
        // The device keeps oscillating: settle on the lower tier and stop adapting.
        change(-1);
        locked.current = true;
      }}
    />
  );
}

export default function SignalCanvas() {
  const tier = useApp((s) => s.tier);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  // Touch devices scroll natively, so DOM-synced WebGL posters would lag: they use the SVG posters.
  const posters = useMemo(() => !isCoarsePointer(), []);
  const dpr = Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio, TIERS[tier]!.dpr, MAX_DPR);

  useEffect(() => {
    const detach = attachPointer();
    let n = 0;
    // One RAF loop for the whole site: GSAP's ticker drives Lenis, ScrollTrigger and this canvas.
    const tick = () => {
      if (document.hidden) return;
      // Reduced motion: the stage is a still image, refreshed slowly to follow route changes.
      if (reduced && n++ % 6 !== 0) return;
      advance(performance.now());
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      detach();
    };
  }, [reduced]);

  return (
    <Canvas
      flat
      frameloop="never"
      dpr={dpr}
      resize={{ scroll: false, debounce: { scroll: 0, resize: 120 } }}
      gl={{
        antialias: false,
        alpha: false,
        depth: false,
        stencil: false,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
      }}
      style={{ position: 'absolute', inset: 0 }}
      aria-hidden="true"
      tabIndex={-1}
    >
      <Rig reduced={reduced} posters={posters} />
      <Adaptive />
    </Canvas>
  );
}
