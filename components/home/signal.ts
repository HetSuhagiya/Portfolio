import type { SignalPreset } from '@/content/types';
import { PRESETS, SIGNAL_COLOR } from '@/lib/signal';

/** All home scenes scrub the signal under one owner, so each hands over to the next without a seam. */
export const OWNER = 'home';

/**
 * Where the signal rests at the end of each scene. Scenes overwrite their own entry once they have
 * measured their layout; the following scene reads it as its starting point.
 */
export const stops: Record<'hero' | 'connect' | 'own' | 'act' | 'featured', SignalPreset> = {
  hero: PRESETS.thread,
  connect: PRESETS.merge,
  own: PRESETS.grid,
  act: PRESETS.bars,
  // The thread runs behind the posters and shows in the gaps between them: one signal through all the work.
  featured: { layout: 'thread', color: SIGNAL_COLOR, turbulence: 0.08, flow: 0.3, spread: 0.3, y: -0.06, scale: 0.7, intensity: 0.8 },
};
