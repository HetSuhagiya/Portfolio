'use client';

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { gsap, ScrollTrigger, EASE } from '@/lib/gsap';
import { useApp } from '@/lib/store';
import { PRESETS, clearScrub, setPaper, setSignal, signalStore, wipe } from '@/lib/signal';
import { startHandoff } from '@/lib/posters';
import { getLenis, scrollToTarget, scrollToTop } from '@/lib/scroll';
import { prefersReducedMotion } from '@/lib/utils';
import { onIdle } from '@/lib/idle';
import type { SignalPreset } from '@/content/types';

export type RouteInfo = { signal: SignalPreset; theme: 'ink' | 'paper'; tint: string };
export type RouteMap = Record<string, RouteInfo>;

export type NavigateOptions = {
  /** Shared-element transition: the slug whose title and poster continue into the next page. */
  shared?: { slug: string; root: HTMLElement | null; poster?: HTMLElement | null };
};

type Ctx = {
  navigate: (href: string, options?: NavigateOptions) => void;
  routes: RouteMap;
  routeFor: (pathname: string) => RouteInfo;
};

const TransitionContext = createContext<Ctx | null>(null);

export function useTransition(): Ctx {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error('useTransition must be used inside <TransitionProvider>');
  return ctx;
}

const FALLBACK: RouteInfo = { signal: PRESETS.lost, theme: 'ink', tint: '#5CF2D6' };

type VTDocument = Document & {
  startViewTransition?: (cb: () => Promise<void> | void) => {
    finished: Promise<void>;
    updateCallbackDone: Promise<void>;
    ready: Promise<void>;
    skipTransition: () => void;
  };
};

type SharedName = 'case-title' | 'case-poster';

function clearSharedNames(): void {
  document.querySelectorAll<HTMLElement>('[data-vt-live]').forEach((el) => {
    el.style.viewTransitionName = '';
    el.removeAttribute('data-vt-live');
  });
}

function nameShared(el: Element | null | undefined, name: SharedName): void {
  if (!(el instanceof HTMLElement)) return;
  el.style.viewTransitionName = name;
  el.setAttribute('data-vt-live', '');
}

function applyRoute(info: RouteInfo): void {
  const root = document.documentElement;
  root.dataset.theme = info.theme;
  root.style.setProperty('--tint', info.tint);
  setPaper(info.theme === 'paper');
}

/**
 * Route transitions.
 *
 *   click → the signal sweeps across the stage (fluid wipe) while visible text exits, masked and staggered
 *         → the route swaps inside a View Transition, so a work card's title and poster morph into the hero
 *         → the incoming hero reveals
 *
 * Fallbacks: GSAP Flip where View Transitions are missing; a plain fade under reduced motion.
 * Total 0.9–1.3 s. Back/forward are never intercepted, so history stays native.
 */
export function TransitionProvider({ routes, children }: { routes: RouteMap; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const pending = useRef<(() => void) | null>(null);
  const busy = useRef(false);
  const first = useRef(true);
  const lastPath = useRef(pathname);

  const routeFor = useCallback((p: string): RouteInfo => routes[p] ?? FALLBACK, [routes]);

  // Runs in the same commit as the new page's DOM.
  useLayoutEffect(() => {
    const info = routeFor(pathname);
    applyRoute(info);

    if (first.current) {
      first.current = false;
      // First load: every route begins as noise, then resolves into its own state once the preloader lifts.
      if (useApp.getState().preloaded || prefersReducedMotion()) {
        setSignal(info.signal);
      } else {
        setSignal({ ...info.signal, layout: 'noise', turbulence: 0.9, intensity: 0.8 });
        const unsub = useApp.subscribe((s) => {
          if (!s.preloaded) return;
          unsub();
          if (!signalStore.getState().scrub) setSignal(routeFor(window.location.pathname).signal);
        });
      }
      return;
    }
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    if (pending.current) {
      // Our own navigation: start at the top, then let the transition continue.
      scrollToTop(true);
      const resolve = pending.current;
      pending.current = null;
      resolve();
    } else {
      // Back / forward: the browser restores scroll; we only cross-fade the content in.
      useApp.getState().setNav('pop');
      clearScrub();
      setSignal(info.signal);
      const page = document.getElementById('page');
      if (page) gsap.fromTo(page, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: EASE.out, clearProps: 'opacity' });
    }
    getLenis()?.resize();
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [pathname, routeFor]);

  // Warm the main routes when the browser is idle.
  useEffect(() => {
    return onIdle(() => Object.keys(routes).forEach((href) => router.prefetch(href)), 4000);
  }, [router, routes]);

  const navigate = useCallback(
    (href: string, options?: NavigateOptions) => {
      const url = new URL(href, window.location.href);
      const app = useApp.getState();

      if (url.pathname === window.location.pathname) {
        app.setMenu(false);
        if (url.hash) scrollToTarget(url.hash);
        else scrollToTop(false);
        return;
      }
      if (busy.current) return;
      busy.current = true;

      const reduced = prefersReducedMotion();
      const info = routeFor(url.pathname);
      const page = document.getElementById('page');
      const doc = document as VTDocument;
      const noVT = new URLSearchParams(window.location.search).has('novt');
      const useVT = !reduced && !noVT && typeof doc.startViewTransition === 'function';
      const shared = options?.shared;
      const sharedTitle = shared?.root?.querySelector<HTMLElement>('[data-shared-title]') ?? null;
      const sharedPoster = shared?.poster ?? shared?.root?.querySelector<HTMLElement>('[data-poster]') ?? null;

      app.setMenu(false);
      app.setNav('push');
      app.setPhase('exit');
      router.prefetch(href);

      // The signal starts morphing toward the next route immediately: the transition is the story.
      clearScrub();
      setSignal(info.signal);
      if (shared) startHandoff(shared.slug, sharedPoster);
      if (!reduced) wipe(1, 1150);

      const swap = () =>
        new Promise<void>((resolve) => {
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            resolve();
          };
          pending.current = finish;
          router.push(href);
          // Never hold the page hostage if the route is slow to arrive.
          window.setTimeout(finish, 3500);
        });

      const settle = () => {
        const main = document.getElementById('main');
        main?.focus({ preventScroll: true });
        app.setPhase('idle');
        busy.current = false;
      };

      const run = async () => {
        if (reduced) {
          // Plain fade.
          if (page) await gsap.to(page, { opacity: 0, duration: 0.18, ease: 'none' });
          await swap();
          app.setPhase('enter');
          const next = document.getElementById('page');
          if (next) gsap.fromTo(next, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'none', clearProps: 'opacity' });
          settle();
          return;
        }

        // 1. Visible text exits, masked and staggered (the shared title stays: it is about to travel).
        if (page) {
          const vh = window.innerHeight;
          const lines = Array.from(page.querySelectorAll<HTMLElement>('.rl, .rc')).filter((el) => {
            if (sharedTitle && sharedTitle.contains(el)) return false;
            const r = el.getBoundingClientRect();
            return r.bottom > 0 && r.top < vh;
          });
          if (lines.length) {
            gsap.to(lines.slice(0, 80), {
              yPercent: -115,
              duration: 0.36,
              ease: EASE.in,
              stagger: { amount: 0.14 },
              overwrite: true,
            });
          }
        }
        await new Promise((r) => window.setTimeout(r, 300));

        if (useVT) {
          // 2a. View Transition: shared elements morph, the stage keeps rendering underneath.
          clearSharedNames();
          nameShared(sharedTitle, 'case-title');
          if (!useApp.getState().glPosters) nameShared(sharedPoster, 'case-poster');
          const vt = doc.startViewTransition!(async () => {
            await swap();
            clearSharedNames();
            if (shared) {
              nameShared(document.querySelector('[data-hero-title]'), 'case-title');
              if (!useApp.getState().glPosters) nameShared(document.querySelector('[data-hero-poster]'), 'case-poster');
            }
            useApp.getState().setPhase('enter');
          });
          try {
            await vt.finished;
          } catch {
            /* skipped transitions still land on the new page */
          }
          clearSharedNames();
        } else {
          // 2b. GSAP Flip fallback.
          let state: ReturnType<typeof import('gsap/Flip').Flip.getState> | null = null;
          const { Flip } = await import('gsap/Flip');
          gsap.registerPlugin(Flip);
          if (sharedTitle) {
            sharedTitle.dataset.flipId = 'case-title';
            state = Flip.getState(sharedTitle);
          }
          if (page) await gsap.to(page, { opacity: 0, duration: 0.22, ease: 'none' });
          await swap();
          app.setPhase('enter');
          const next = document.getElementById('page');
          if (next) gsap.fromTo(next, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: EASE.out, clearProps: 'opacity' });
          const target = document.querySelector<HTMLElement>('[data-hero-title]');
          if (state && target) {
            target.dataset.flipId = 'case-title';
            Flip.from(state, { targets: target, duration: 0.85, ease: EASE.out, scale: true, absolute: true });
          }
          await new Promise((r) => window.setTimeout(r, 450));
        }
        settle();
      };

      run().catch(() => {
        // Last resort: a normal navigation.
        busy.current = false;
        app.setPhase('idle');
        window.location.href = href;
      });
    },
    [routeFor, router],
  );

  const value = useMemo(() => ({ navigate, routes, routeFor }), [navigate, routes, routeFor]);
  return <TransitionContext.Provider value={value}>{children}</TransitionContext.Provider>;
}
