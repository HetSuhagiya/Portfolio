'use client';

import { useId } from 'react';
import { scaleLinear } from 'd3-scale';
import { area as d3area, curveMonotoneX, line as d3line } from 'd3-shape';
import { useTweenedArray } from '@/hooks/useTween';

export type ChartKind = 'bar' | 'line' | 'area';

const W = 300;
const H = 120;
const PAD = 6;

/**
 * A small SVG chart (bar, line or area) that tweens between datasets.
 * Purely presentational: callers provide the accessible description.
 */
export function Chart({
  values,
  kind,
  color = 'var(--tint)',
  highlight,
  className,
}: {
  values: number[];
  kind: ChartKind;
  color?: string;
  /** Index of a bar/point to emphasise. */
  highlight?: number;
  className?: string;
}) {
  const id = useId();
  const v = useTweenedArray(values, 0.7);
  const n = v.length;
  const max = Math.max(...v, 1e-9);
  const min = Math.min(...v);
  // Bars and areas encode value as filled height, so they start at zero. A line may zoom in on its range.
  const lo = kind === 'line' ? min - (max - min) * 0.25 : 0;
  const y = scaleLinear().domain([lo, max]).range([H - PAD, PAD]);
  const x = (i: number) => (n <= 1 ? W / 2 : PAD + (i / (n - 1)) * (W - PAD * 2));

  let body;
  if (kind === 'bar') {
    const band = (W - PAD * 2) / n;
    body = v.map((val, i) => {
      const h = Math.max(1, H - PAD - y(val));
      return (
        <rect
          key={i}
          x={PAD + i * band + band * 0.14}
          y={H - PAD - h}
          width={band * 0.72}
          height={h}
          fill={color}
          fillOpacity={highlight === undefined || highlight === i ? 0.9 : 0.4}
        />
      );
    });
  } else {
    const pts = v.map((val, i) => [x(i), y(val)] as [number, number]);
    const path = d3line().curve(curveMonotoneX)(pts) ?? '';
    const fill = d3area()
      .curve(curveMonotoneX)
      .y0(H - PAD)(pts);
    body = (
      <>
        {kind === 'area' ? (
          <>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={color} stopOpacity={0.45} />
                <stop offset="1" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={fill ?? ''} fill={`url(#${id})`} />
          </>
        ) : null}
        <path d={path} fill="none" stroke={color} strokeWidth={1.75} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden="true" focusable="false">
      <line x1={0} x2={W} y1={H - PAD + 0.5} y2={H - PAD + 0.5} stroke="var(--line)" vectorEffect="non-scaling-stroke" />
      {body}
    </svg>
  );
}
