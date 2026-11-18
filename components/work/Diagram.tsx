'use client';

import { useMemo, useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/utils';
import type { CaseStudy, DiagramNode } from '@/content/types';

type Spec = CaseStudy['build']['diagram'];
type Placed = DiagramNode & { x: number; y: number; w: number; h: number; small: boolean };

/** Lay the nodes out left-to-right (desktop) or top-to-bottom (mobile). Columns are centred. */
function layout(spec: Spec, vertical: boolean): { nodes: Placed[]; W: number; H: number } {
  const cols = Math.max(...spec.nodes.map((n) => n.col)) + 1;
  const byCol = Array.from({ length: cols }, (_, c) => spec.nodes.filter((n) => n.col === c).sort((a, b) => a.row - b.row));
  const maxRows = Math.max(...byCol.map((c) => c.length));
  const nodes: Placed[] = [];

  if (!vertical) {
    const cellW = 196;
    const cellH = 84;
    const W = cols * cellW;
    const H = Math.max(1, maxRows) * cellH;
    byCol.forEach((col, c) => {
      col.forEach((n, i) => {
        nodes.push({ ...n, w: 160, h: 58, small: false, x: c * cellW + cellW / 2, y: (i + (maxRows - col.length) / 2) * cellH + cellH / 2 });
      });
    });
    return { nodes, W, H };
  }

  const W = 328;
  const cellH = 92;
  byCol.forEach((col, c) => {
    const gap = 8;
    const w = Math.min(190, (W - gap * (col.length - 1)) / col.length);
    const total = col.length * w + gap * (col.length - 1);
    col.forEach((n, i) => {
      nodes.push({ ...n, w, h: 54, small: w < 110, x: (W - total) / 2 + i * (w + gap) + w / 2, y: c * cellH + cellH / 2 });
    });
  });
  return { nodes, W, H: cols * cellH };
}

function DiagramSvg({ spec, vertical, className }: { spec: Spec; vertical: boolean; className: string }) {
  const { nodes, W, H } = useMemo(() => layout(spec, vertical), [spec, vertical]);
  const byId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden="true" focusable="false" fill="none">
      {spec.edges.map(([a, b]) => {
        const s = byId.get(a);
        const t = byId.get(b);
        if (!s || !t) return null;
        let d: string;
        if (!vertical) {
          const x1 = s.x + s.w / 2;
          const x2 = t.x - t.w / 2;
          const mx = (x1 + x2) / 2;
          d = `M${x1} ${s.y} C ${mx} ${s.y}, ${mx} ${t.y}, ${x2} ${t.y}`;
        } else {
          const y1 = s.y + s.h / 2;
          const y2 = t.y - t.h / 2;
          const my = (y1 + y2) / 2;
          d = `M${s.x} ${y1} C ${s.x} ${my}, ${t.x} ${my}, ${t.x} ${y2}`;
        }
        return (
          <path
            key={`${a}-${b}`}
            data-edge={t.col}
            d={d}
            pathLength={1}
            strokeDasharray="1 1"
            stroke={t.decision ? 'var(--decide)' : 'var(--tint)'}
            strokeWidth={1.25}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      {nodes.map((n) => {
        const c = n.decision ? 'var(--decide)' : 'var(--tint)';
        return (
          <g key={n.id} data-node={n.col} transform={`translate(${n.x - n.w / 2} ${n.y - n.h / 2})`}>
            <rect width={n.w} height={n.h} rx={8} fill="var(--bg)" />
            <rect width={n.w} height={n.h} rx={8} fill={c} fillOpacity={0.08} stroke={c} strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
            <text
              x={n.w / 2}
              y={n.sub && !n.small ? n.h / 2 - 3 : n.h / 2 + 4}
              textAnchor="middle"
              fill="var(--fg)"
              fontFamily="var(--font-mono)"
              fontSize={n.small ? 9.5 : 12.5}
            >
              {n.label}
            </text>
            {n.sub && !n.small ? (
              <text x={n.w / 2} y={n.h / 2 + 14} textAnchor="middle" fill="var(--fg-mute)" fontFamily="var(--font-mono)" fontSize={10}>
                {n.sub}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Architecture diagram. Nodes light up in sequence, column by column, as the diagram scrolls into view.
 * The amber node is where the work turns into a decision.
 */
export function Diagram({ spec }: { spec: Spec }) {
  const ref = useRef<HTMLElement>(null);
  const cols = Math.max(...spec.nodes.map((n) => n.col)) + 1;
  const label = useMemo(() => {
    const names = new Map(spec.nodes.map((n) => [n.id, n.label]));
    return `Architecture diagram. ${spec.edges.map(([a, b]) => `${names.get(a)} feeds ${names.get(b)}`).join('. ')}.`;
  }, [spec]);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      // Both orientations animate; only one is displayed.
      el.querySelectorAll('svg').forEach((svg) => {
        const tl = gsap.timeline({
          defaults: { overwrite: false },
          scrollTrigger: { trigger: el, start: 'top 75%', once: true },
        });
        gsap.set(svg.querySelectorAll('[data-node]'), { opacity: 0.18 });
        gsap.set(svg.querySelectorAll('[data-edge]'), { strokeDashoffset: 1 });
        for (let c = 0; c < cols; c++) {
          const edges = svg.querySelectorAll(`[data-edge="${c}"]`);
          const nodes = svg.querySelectorAll(`[data-node="${c}"]`);
          if (edges.length) tl.to(edges, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.inOut', stagger: 0.05 });
          tl.to(nodes, { opacity: 1, duration: 0.45, ease: 'power2.out', stagger: 0.07 }, edges.length ? '-=0.15' : 0.1);
        }
      });
    },
    { scope: ref },
  );

  return (
    <figure ref={ref} role="img" aria-label={label} className="panel overflow-clip p-4 sm:p-8">
      <DiagramSvg spec={spec} vertical={false} className="hidden h-auto w-full md:block" />
      <DiagramSvg spec={spec} vertical className="mx-auto h-auto w-full max-w-[26rem] md:hidden" />
      <figcaption className="text-caption mt-5">{spec.caption}</figcaption>
    </figure>
  );
}
