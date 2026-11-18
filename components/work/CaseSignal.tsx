'use client';

import { ScrollTrigger, useGSAP } from '@/lib/gsap';
import { blendSignal, releaseSignal } from '@/lib/signal';
import { easeInOut } from '@/lib/fit';
import { prefersReducedMotion } from '@/lib/utils';
import type { SignalPreset } from '@/content/types';

/**
 * Where a page's signal settles once the reader moves from the hero into the story.
 * Each behaviour means something: the caret becomes chart tiles, the tangle is combed straight,
 * and everything quietens so the copy stays readable.
 */
function resting(s: SignalPreset): SignalPreset {
  const i = s.intensity ?? 1;
  if (s.layout === 'caret') return { ...s, layout: 'tiles', x: 0, y: 0, turbulence: 0.04, intensity: 0.3 };
  if (s.layout === 'combed') return { ...s, param: 0, turbulence: 0.03, intensity: i * 0.4 };
  if (s.layout === 'dots') return { ...s, intensity: i * 0.3, turbulence: 0.02 };
  if (s.layout === 'lattice') return { ...s, intensity: i * 0.35, scale: 1.2 };
  if (s.layout === 'pipeline') return { ...s, y: -0.86, intensity: i * 0.5, scale: 0.8 };
  return { ...s, y: -0.82, intensity: i * 0.55, turbulence: (s.turbulence ?? 0.15) * 0.6 };
}

const OWNER = 'case';

export function CaseSignal({ signal }: { signal: SignalPreset }) {
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const body = document.getElementById('case-body');
      if (!body) return;
      const rest = resting(signal);
      const st = ScrollTrigger.create({
        trigger: body,
        start: 'top 92%',
        end: 'top 25%',
        onUpdate: (self) => blendSignal(OWNER, signal, rest, easeInOut(self.progress)),
        onLeaveBack: () => releaseSignal(OWNER),
      });
      return () => {
        st.kill();
        releaseSignal(OWNER);
      };
    },
    { dependencies: [signal] },
  );
  return null;
}
