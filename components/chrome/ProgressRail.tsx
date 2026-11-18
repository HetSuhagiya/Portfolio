'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { scrollToTarget } from '@/lib/scroll';
import { cn } from '@/lib/utils';

type Chapter = { id: string; title: string; el: HTMLElement; at: number };

/**
 * Persistent thin line on the left: scroll progress within the current page, with its chapters.
 * Sections opt in with data-chapter="Name". Desktop only; the page is fully usable without it.
 */
export function ProgressRail() {
  const pathname = usePathname();
  const fill = useRef<HTMLDivElement>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [active, setActive] = useState(0);
  const data = useRef<Chapter[]>([]);
  const activeRef = useRef(0);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      const max = Math.max(1, ScrollTrigger.maxScroll(window));
      const list = Array.from(document.querySelectorAll<HTMLElement>('#page [data-chapter]')).map((el, i) => {
        if (!el.id) el.id = `chapter-${i + 1}`;
        const top = el.getBoundingClientRect().top + window.scrollY;
        return { id: el.id, title: el.dataset.chapter ?? '', el, at: Math.min(1, top / max) };
      });
      data.current = list;
      setChapters(list);
    };
    const queue = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    const setY = fill.current ? gsap.quickSetter(fill.current, 'scaleY') : null;
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        setY?.(self.progress);
        const list = data.current;
        let idx = 0;
        const p = self.progress + 0.5 * (window.innerHeight / Math.max(1, ScrollTrigger.maxScroll(window)));
        for (let i = 0; i < list.length; i++) if (p >= list[i]!.at) idx = i;
        if (idx !== activeRef.current) {
          activeRef.current = idx;
          setActive(idx);
        }
      },
    });
    setY?.(st.progress);
    activeRef.current = 0;

    queue();
    ScrollTrigger.addEventListener('refresh', queue);
    // Lazy modules change the page height after mount.
    const ro = new ResizeObserver(queue);
    const page = document.getElementById('page');
    if (page) ro.observe(page);

    return () => {
      cancelAnimationFrame(raf);
      st.kill();
      ScrollTrigger.removeEventListener('refresh', queue);
      ro.disconnect();
    };
  }, [pathname]);

  return (
    <nav
      id="rail"
      data-chrome
      aria-label="Chapters on this page"
      className="fixed top-0 bottom-0 left-0 z-30 hidden w-(--rail) lg:block"
      style={{ viewTransitionName: 'rail' }}
    >
      {/* The current chapter, set vertically so it stays inside the rail's own column. */}
      <p
        aria-hidden="true"
        className="text-label absolute bottom-8 left-1/2 h-36 -translate-x-1/2 rotate-180 overflow-clip text-right whitespace-nowrap text-mute [writing-mode:vertical-rl]"
      >
        {chapters[active]?.title}
      </p>
      <div className="absolute top-[calc(var(--bar-h)+1rem)] bottom-48 left-1/2 w-px -translate-x-1/2 bg-line">
        <div ref={fill} className="absolute inset-0 origin-top scale-y-0 bg-accent" />
        <ol>
          {chapters.map((c, i) => (
            <li key={c.id} className="absolute left-1/2 -translate-x-1/2" style={{ top: `${c.at * 100}%` }}>
              <button
                type="button"
                onClick={() => scrollToTarget(c.el)}
                aria-current={i === active ? 'step' : undefined}
                className="group relative grid h-6 w-11 -translate-y-1/2 place-items-center"
              >
                <span className="sr-only">{`Go to chapter ${i + 1}: ${c.title}`}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'block h-px w-4 transition-[scale,background-color] duration-300 ease-(--ease-out)',
                    i === active ? 'bg-accent' : 'scale-x-50 bg-line-strong group-hover:scale-x-100 group-hover:bg-fg',
                  )}
                />
                <span
                  aria-hidden="true"
                  className="text-label pointer-events-none absolute top-1/2 left-[calc(100%-0.25rem)] -translate-y-1/2 rounded-full border border-line bg-surface-strong px-3 py-1.5 whitespace-nowrap text-fg opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  {c.title}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
