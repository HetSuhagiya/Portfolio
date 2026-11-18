'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { useApp } from '@/lib/store';
import { registerPoster, unregisterPoster, type PosterSlot } from '@/lib/posters';
import { cn, hexToRgb } from '@/lib/utils';
import { PosterArt } from './PosterArt';

type Props = {
  slug: string;
  tint: string;
  /** The case-study hero: receives the poster handed off from a work card. */
  hero?: boolean;
  className?: string;
  style?: CSSProperties;
};

/**
 * A slot for a generative poster.
 *
 * The SVG art is always in the HTML. When the persistent WebGL canvas is running on a desktop pointer,
 * the slot registers itself and the canvas draws the live shader version exactly underneath it, with
 * hover distortion. Hover is taken from the nearest [data-poster-host] ancestor (usually the link).
 */
export function Poster({ slug, tint, hero = false, className, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const glPosters = useApp((s) => s.glPosters);

  useEffect(() => {
    const el = ref.current;
    if (!el || !glPosters) return;
    const slot: PosterSlot = registerPoster(el, slug, hexToRgb(tint), hero);
    const host = el.closest<HTMLElement>('[data-poster-host]') ?? el;
    const on = () => (slot.hover = 1);
    const off = () => (slot.hover = 0);
    host.addEventListener('pointerenter', on);
    host.addEventListener('pointerleave', off);
    host.addEventListener('focusin', on);
    host.addEventListener('focusout', off);
    return () => {
      host.removeEventListener('pointerenter', on);
      host.removeEventListener('pointerleave', off);
      host.removeEventListener('focusin', on);
      host.removeEventListener('focusout', off);
      unregisterPoster(slot);
    };
  }, [glPosters, slug, tint, hero]);

  return (
    <div
      ref={ref}
      className={cn('poster', className)}
      style={style}
      data-poster={slug}
      {...(hero ? { 'data-hero-poster': '' } : {})}
      aria-hidden="true"
    >
      <PosterArt slug={slug} tint={tint} className="poster-art" />
    </div>
  );
}
