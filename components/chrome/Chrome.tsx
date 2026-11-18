'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { gsap, useGSAP, EASE } from '@/lib/gsap';
import { useApp } from '@/lib/store';
import { PRESETS, blendToward, releaseSignal, wipe } from '@/lib/signal';
import { lockScroll } from '@/lib/scroll';
import { cn, prefersReducedMotion } from '@/lib/utils';
import { TransitionLink } from '@/components/transition/TransitionLink';
import { Magnetic } from '@/components/motion/Magnetic';
import { nav, site } from '@/content/site';

export type MenuCase = { slug: string; no: string; short: string };

function StatusPill({ className }: { className?: string }) {
  return (
    <span className={cn('text-label text-fg inline-flex items-center gap-2.5', className)}>
      <span className="pulse-dot" aria-hidden="true" />
      {site.status}
    </span>
  );
}

/** Top bar + full-screen menu. The menu is a disclosure: a button that expands a nav region. */
export function Chrome({ cases }: { cases: MenuCase[] }) {
  const pathname = usePathname();
  const open = useApp((s) => s.menuOpen);
  const setMenu = useApp((s) => s.setMenu);
  const overlay = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // Fluid reveal: the signal sweeps across the stage while the links rise, masked and staggered.
  useGSAP(
    () => {
      const el = overlay.current;
      if (!el) return;
      const reduced = prefersReducedMotion();
      const items = el.querySelectorAll('[data-menu-item]');
      const fades = el.querySelectorAll('[data-menu-fade]');
      if (open) {
        gsap.set(el, { visibility: 'visible' });
        gsap.to(el, { opacity: 1, duration: reduced ? 0.15 : 0.5, ease: EASE.out });
        if (!reduced) {
          gsap.fromTo(
            items,
            { yPercent: 115 },
            { yPercent: 0, duration: 0.9, ease: EASE.out, stagger: 0.06, delay: 0.08 },
          );
          gsap.fromTo(
            fades,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.7, ease: EASE.out, stagger: 0.04, delay: 0.3 },
          );
          wipe(1, 1000);
        }
      } else {
        if (!reduced && wasOpen.current)
          gsap.to(items, { yPercent: -115, duration: 0.3, ease: EASE.in, stagger: 0.02 });
        gsap.to(el, {
          opacity: 0,
          duration: reduced ? 0.15 : 0.32,
          delay: reduced || !wasOpen.current ? 0 : 0.12,
          ease: 'none',
          onComplete: () => gsap.set(el, { visibility: 'hidden' }),
        });
      }
    },
    { dependencies: [open], scope: overlay },
  );

  useEffect(() => {
    const page = document.getElementById('page');
    const rail = document.getElementById('rail');
    if (open) {
      page?.setAttribute('inert', '');
      rail?.setAttribute('inert', '');
      lockScroll(true);
      blendToward('menu', PRESETS.menu, 1);
      overlay.current?.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
    } else {
      page?.removeAttribute('inert');
      rail?.removeAttribute('inert');
      lockScroll(false);
      releaseSignal('menu');
      if (wasOpen.current && useApp.getState().phase === 'idle')
        button.current?.focus({ preventScroll: true });
    }
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(false);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [open, setMenu]);

  const isCurrent = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <>
      <header
        data-chrome
        className="fixed inset-x-0 top-0 z-50 flex h-(--bar-h) items-center justify-between px-(--gutter)"
        style={{ viewTransitionName: 'topbar' }}
      >
        <div className="flex items-center gap-6">
          <TransitionLink href="/" className="text-title leading-none" aria-label={`${site.name}, home`}>
            {site.name}
          </TransitionLink>
          <div className="hidden md:block">
            <StatusPill />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Magnetic strength={0.2}>
            <a
              href={site.cv.href}
              download={site.cv.filename}
              className="btn btn-sm"
              aria-label="Download CV (PDF)"
            >
              CV
              <span aria-hidden="true">↓</span>
            </a>
          </Magnetic>
          <Magnetic strength={0.2}>
            <button
              ref={button}
              type="button"
              className={cn('btn btn-sm', open && 'btn-solid')}
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setMenu(!open)}
            >
              <span className="grid">
                <span
                  className={cn(
                    'col-start-1 row-start-1 transition-opacity duration-150',
                    open && 'opacity-0',
                  )}
                >
                  Menu
                </span>
                <span
                  className={cn(
                    'col-start-1 row-start-1 transition-opacity duration-150',
                    !open && 'opacity-0',
                  )}
                  aria-hidden={!open}
                >
                  Close
                </span>
              </span>
            </button>
          </Magnetic>
        </div>
      </header>

      <div
        ref={overlay}
        id="site-menu"
        data-chrome
        data-lenis-prevent
        className="invisible fixed inset-0 z-40 overflow-y-auto overscroll-contain opacity-0"
        style={{ background: 'color-mix(in srgb, var(--bg) 88%, transparent)' }}
      >
        <div className="flex min-h-full flex-col px-(--gutter) pt-[calc(var(--bar-h)+2vh)] pb-8">
          <div className="grid-12 flex-1 items-end gap-y-10">
            <nav aria-label="Site" className="col-span-12 lg:col-span-7">
              <ul>
                {nav.map((item) => {
                  const current = isCurrent(item.href);
                  return (
                    <li key={item.href} className="border-line overflow-clip border-b">
                      <TransitionLink
                        href={item.href}
                        aria-current={current ? 'page' : undefined}
                        tabIndex={open ? 0 : -1}
                        className={cn(
                          'group flex items-baseline gap-5 py-[1.1vh] transition-colors duration-300',
                          current ? 'text-accent' : 'text-fg hover:text-accent',
                        )}
                      >
                        <span data-menu-item className="flex w-full items-baseline gap-5">
                          <span className="text-label tnum text-mute w-8">{item.no}</span>
                          <span className="text-display-md lg:text-[clamp(3rem,9.2vh,7rem)]">
                            {item.label}
                          </span>
                          {current ? (
                            <span className="text-label text-mute ml-auto">{'// you are here'}</span>
                          ) : null}
                        </span>
                      </TransitionLink>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="col-span-12 lg:col-span-4 lg:col-start-9">
              <p data-menu-fade className="text-label text-mute mb-4">
                {'// case studies'}
              </p>
              <ul className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-1">
                {cases.map((c) => {
                  const current = pathname === `/work/${c.slug}`;
                  return (
                    <li key={c.slug} data-menu-fade>
                      <TransitionLink
                        href={`/work/${c.slug}`}
                        tabIndex={open ? 0 : -1}
                        aria-current={current ? 'page' : undefined}
                        className={cn(
                          'border-line flex min-h-11 items-center gap-4 border-b py-2 transition-colors duration-200',
                          current ? 'text-accent' : 'text-fg hover:text-accent',
                        )}
                      >
                        <span className="text-label tnum text-mute">{c.no}</span>
                        <span className="text-body">{c.short}</span>
                      </TransitionLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div
            data-menu-fade
            className="border-line mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t pt-5"
          >
            <StatusPill />
            <ul className="text-label flex flex-wrap gap-x-7 gap-y-2">
              <li>
                <a className="link" href={`mailto:${site.email}`} tabIndex={open ? 0 : -1}>
                  {site.email}
                </a>
              </li>
              <li>
                <a
                  className="link"
                  href={site.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={open ? 0 : -1}
                >
                  LinkedIn ↗
                </a>
              </li>
              <li>
                <a
                  className="link"
                  href={site.company.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={open ? 0 : -1}
                >
                  {site.company.name} ↗
                </a>
              </li>
              {site.github ? (
                <li>
                  <a
                    className="link"
                    href={site.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={open ? 0 : -1}
                  >
                    GitHub ↗
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
