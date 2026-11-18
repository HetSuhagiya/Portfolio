'use client';

import dynamic from 'next/dynamic';
import { useEffect, useId, useRef, useState, type ComponentType } from 'react';
import type { ModuleId } from '@/content/types';
import type { ModuleProps } from './modules/types';

function Skeleton() {
  return (
    <div className="grid h-full min-h-[24rem] place-items-center">
      <p className="text-caption">{'// loading the demo'}</p>
    </div>
  );
}

/**
 * One lazy chunk per module: a case-study page only ever downloads its own module,
 * and only once the reader is near it.
 */
const MODULES: Record<ModuleId, ComponentType<ModuleProps>> = {
  'ask-your-data': dynamic(() => import('./modules/AskYourData'), { ssr: false, loading: Skeleton }),
  'build-the-report': dynamic(() => import('./modules/BuildTheReport'), { ssr: false, loading: Skeleton }),
  'kpi-tree': dynamic(() => import('./modules/KpiTree'), { ssr: false, loading: Skeleton }),
  'manual-vs-automated': dynamic(() => import('./modules/ManualVsAutomated'), { ssr: false, loading: Skeleton }),
  'follow-the-data': dynamic(() => import('./modules/FollowTheData'), { ssr: false, loading: Skeleton }),
  'ten-thousand-sales': dynamic(() => import('./modules/TenThousandSales'), { ssr: false, loading: Skeleton }),
  'clean-the-file': dynamic(() => import('./modules/CleanTheFile'), { ssr: false, loading: Skeleton }),
};

type Props = ModuleProps & { id: ModuleId; title: string; alt: string };

export function ModuleHost({ id, title, alt, ...props }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '120% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Module = MODULES[id];
  return (
    <div ref={ref} role="group" aria-label={`Interactive demo: ${title}`} aria-describedby={descId} className="module panel relative overflow-clip">
      {/* Text alternative: what this module demonstrates. */}
      <p id={descId} className="sr-only">
        {alt}
      </p>
      {near ? <Module {...props} /> : <Skeleton />}
    </div>
  );
}
