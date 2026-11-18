'use client';

/**
 * One place that registers GSAP plugins and defines the site's motion language.
 * Everything imports gsap from here, so the plugins are registered exactly once.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, useGSAP);
  // Signature easing set: expo-out entrances, power3 in-out for scrubbed moves.
  CustomEase.create('signal', 'M0,0 C0.16,1 0.3,1 1,1');
  CustomEase.create('wipe', 'M0,0 C0.65,0 0.35,1 1,1');
  gsap.defaults({ ease: 'expo.out', duration: 0.9, overwrite: 'auto' });
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export const EASE = {
  /** Entrances. */
  out: 'expo.out',
  /** Scrubbed and two-way moves. */
  inOut: 'power3.inOut',
  /** Exits. */
  in: 'power3.in',
} as const;

export const DUR = { fast: 0.6, base: 0.9, slow: 1.2 } as const;

export { gsap, ScrollTrigger, SplitText, useGSAP };
