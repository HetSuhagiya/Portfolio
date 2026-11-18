'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useMedia';
import { Demo, Choice, Metrics } from './Demo';
import { number, money } from './demo-data';
import { sales, categories, months, retailSummary, type Sale } from './retail-data';
import type { ModuleProps } from './types';
type Grouping = 'all' | 'category' | 'month';
function Dots({ rows, grouping }: { rows: Sale[]; grouping: Grouping }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    const draw = () => {
      cancelAnimationFrame(frame);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const css = getComputedStyle(canvas);
      const tint = css.getPropertyValue('--tint').trim();
      const fg = css.getPropertyValue('--fg').trim();
      const keys =
        grouping === 'category' ? categories : grouping === 'month' ? months : ['All transactions'];
      const columns = width < 450 && keys.length > 1 ? 2 : keys.length;
      const gridRows = Math.ceil(keys.length / columns);
      const cellW = width / columns;
      const cellH = height / gridRows;
      const groups = keys.map((key) => rows.filter((r) => grouping === 'all' || r[grouping] === key));
      const maxCount = Math.max(1, ...groups.map((g) => g.length));
      const cols = Math.max(1, Math.ceil(Math.sqrt((maxCount * (cellW - 12)) / (cellH - 38))));
      const spacing = Math.min((cellW - 12) / cols, (cellH - 38) / Math.ceil(maxCount / cols));
      const dots = groups.flatMap((group, g) =>
        group.map((r, i) => ({
          id: r.id,
          x: (g % columns) * cellW + 6 + (i % cols) * spacing,
          y: Math.floor(g / columns) * cellH + 32 + Math.floor(i / cols) * spacing,
        })),
      );
      const started = performance.now();
      const paint = (now: number) => {
        const t = reduced ? 1 : Math.min(1, (now - started) / 350);
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = fg;
        ctx.font = '11px system-ui';
        groups.forEach((group, g) =>
          ctx.fillText(
            `${keys[g]} · ${number(group.length)}`,
            (g % columns) * cellW + 6,
            Math.floor(g / columns) * cellH + 17,
          ),
        );
        ctx.fillStyle = tint;
        // Draw all points in one canvas; no React node or animation object per transaction.
        for (const p of dots) {
          const x0 = ((p.id % 100) / 100) * (width - 8) + 4;
          const y0 = (Math.floor(p.id / 100) / 100) * (height - 35) + 30;
          ctx.fillRect(
            x0 + (p.x - x0) * t,
            y0 + (p.y - y0) * t,
            Math.max(0.6, spacing * 0.68),
            Math.max(0.6, spacing * 0.68),
          );
        }
        if (t < 1) frame = requestAnimationFrame(paint);
      };
      frame = requestAnimationFrame(paint);
    };
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [rows, grouping, reduced]);
  return (
    <canvas
      ref={ref}
      className="demo-dots"
      role="img"
      aria-label={`${number(rows.length)} synthetic transactions grouped by ${grouping}. Counts are also listed in the summary below.`}
    />
  );
}
export default function TenThousandSales(props: ModuleProps) {
  const [group, setGroup] = useState<Grouping | null>(null);
  const [category, setCategory] = useState('All');
  const [month, setMonth] = useState('All');
  const grouping = group ?? (['all', 'category', 'month', 'category'] as const)[props.step]!;
  const rows = useMemo(
    () =>
      sales.filter(
        (s) => (category === 'All' || s.category === category) && (month === 'All' || s.month === month),
      ),
    [category, month],
  );
  const summary = useMemo(() => retailSummary(rows, month === 'All' ? 6 : 1), [rows, month]);
  const keys = grouping === 'category' ? categories : grouping === 'month' ? months : ['All transactions'];
  return (
    <Demo
      {...props}
      title="10,000 sales"
      subtitle="One dot per transaction. Regroup the rows to reveal a pattern."
      labels={['All sales', 'Products', 'Months', 'Stock cover']}
      onReset={() => {
        setGroup(null);
        setCategory('All');
        setMonth('All');
      }}
    >
      <Choice
        label="Group transactions"
        value={grouping}
        onChange={setGroup}
        options={[
          { value: 'all', label: 'All dots' },
          { value: 'category', label: 'Category' },
          { value: 'month', label: 'Month' },
        ]}
      />
      <div className="demo-toolbar">
        <label className="demo-select">
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {['All', ...categories].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="demo-select">
          Month
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            {['All', ...months].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>
      <Metrics
        items={[
          { label: 'Transactions', value: number(rows.length) },
          { label: 'Sales', value: money(summary.total) },
          { label: 'Products below 4 weeks cover', value: String(summary.risk.length) },
        ]}
      />
      <Dots rows={rows} grouping={grouping} />
      <p className="demo-note" role="status">
        {keys
          .map((k) => `${k}: ${number(rows.filter((r) => grouping === 'all' || r[grouping] === k).length)}`)
          .join(' · ')}
      </p>
      <div
        className="demo-table-wrap"
        tabIndex={0}
        role="region"
        aria-label="Data table, scroll horizontally for more columns"
      >
        <table className="demo-table">
          <caption>Product ranking and stock cover · current selection</caption>
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Units sold</th>
              <th scope="col">Stock</th>
              <th scope="col">Weeks cover</th>
              <th scope="col">Signal</th>
            </tr>
          </thead>
          <tbody>
            {summary.ranked.map((p) => (
              <tr key={p.name}>
                <th scope="row">{p.name}</th>
                <td>{number(p.units)}</td>
                <td>{p.stock}</td>
                <td>{p.cover.toFixed(1)}</td>
                <td>{p.cover < 4 ? 'Review stock' : 'Covered'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="demo-note">
        Cover = fixed synthetic stock ÷ average weekly units in the selected period (30 days per month). Below
        four weeks flags a review; this is not a live reorder recommendation.
      </p>
    </Demo>
  );
}
