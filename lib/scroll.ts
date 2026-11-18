import type Lenis from 'lenis';

/** The single Lenis instance (null under reduced motion, where scrolling is native). */
let lenis: Lenis | null = null;

export const setLenis = (l: Lenis | null): void => {
  lenis = l;
};
export const getLenis = (): Lenis | null => lenis;

export function scrollToTop(immediate = true): void {
  if (lenis) lenis.scrollTo(0, { immediate, force: true });
  else window.scrollTo({ top: 0, behavior: immediate ? 'instant' : 'smooth' });
}

/** Scroll to an element, a selector or a pixel offset. Smooth with Lenis, native otherwise. */
export function scrollToTarget(target: HTMLElement | string | number, offset = 0, immediate = false): void {
  if (lenis) {
    lenis.scrollTo(target, { offset, immediate, duration: 1.1, force: true });
    return;
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior: ScrollBehavior = immediate || reduce ? 'instant' : 'smooth';
  if (typeof target === 'number') {
    window.scrollTo({ top: target + offset, behavior });
    return;
  }
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, behavior });
}

export function lockScroll(lock: boolean): void {
  if (lenis) {
    if (lock) lenis.stop();
    else lenis.start();
  } else {
    document.documentElement.style.overflow = lock ? 'hidden' : '';
  }
}
