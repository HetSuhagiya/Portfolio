/**
 * Route → signal state, theme and tint. Built on the server from /content and passed to the
 * client once, so the transition system knows where the signal is going before the page arrives.
 */
import type { RouteMap } from '@/components/transition/TransitionProvider';
import { caseStudies } from '@/content/work';
import { PRESETS, SIGNAL_COLOR } from './signal';

export function buildRouteMap(): RouteMap {
  const map: RouteMap = {
    '/': { signal: PRESETS.thread, theme: 'ink', tint: SIGNAL_COLOR },
    '/about': { signal: PRESETS.about, theme: 'ink', tint: SIGNAL_COLOR },
    '/work': { signal: PRESETS.index, theme: 'ink', tint: SIGNAL_COLOR },
    '/resume': { signal: PRESETS.resume, theme: 'paper', tint: '#1B2A4A' },
    '/contact': { signal: PRESETS.contact, theme: 'ink', tint: '#FFB547' },
  };
  for (const c of caseStudies) {
    map[`/work/${c.slug}`] = { signal: c.signal, theme: c.theme, tint: c.tint };
  }
  return map;
}
