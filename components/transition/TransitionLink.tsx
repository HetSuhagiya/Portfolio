'use client';

import Link from 'next/link';
import { useRef, type ComponentProps, type MouseEvent } from 'react';
import { useTransition } from './TransitionProvider';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
  /** Slug of the case study whose title and poster should travel into the next page. */
  shared?: string;
  /** A poster element outside the link (for example the floating poster on the work index). */
  sharedPoster?: () => HTMLElement | null;
};

/**
 * A real link (prefetched on hover and in view by next/link, opens in a new tab with modifier keys)
 * that plays the signal transition on a plain click.
 */
export function TransitionLink({ href, shared, sharedPoster, onClick, children, ...rest }: Props) {
  const { navigate } = useTransition();
  const ref = useRef<HTMLAnchorElement>(null);

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (rest.target === '_blank' || /^(https?:)?\/\//.test(href) || href.startsWith('mailto:')) return;
    e.preventDefault();
    navigate(href, shared ? { shared: { slug: shared, root: ref.current, poster: sharedPoster?.() } } : undefined);
  };

  return (
    <Link ref={ref} href={href} onClick={handle} {...rest}>
      {children}
    </Link>
  );
}
