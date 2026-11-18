'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { setLenis } from '@/lib/scroll';
import { prefersReducedMotion } from '@/lib/utils';

/**
 * Lenis smooth scroll, driven by GSAP's ticker so the whole site shares one RAF loop.
 * Under reduced motion Lenis is not created at all: scrolling stays native.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      lerp: 0.08,
      autoRaf: false,
      anchors: true,
      // Touch keeps native momentum scrolling.
      syncTouch: false,
    });
    setLenis(lenis);

    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}
