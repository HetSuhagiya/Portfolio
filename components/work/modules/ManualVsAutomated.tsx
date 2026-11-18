'use client';
import { useRef, useState, type CSSProperties } from 'react';
import { Demo, Range, Metrics } from './Demo';
import type { ModuleProps } from './types';
const manual = [
  'Export four source files',
  'Copy, paste and repair formulas',
  'Check totals by hand',
  'Send a static report; repeat next week',
];
const automated = [
  'Scheduled source refresh',
  'SQL views apply the same definitions',
  'Checks stop a mismatched refresh',
  'Publish only validated dashboard data',
];
const labels = ['Manual week', 'Schedule', 'Validate', 'Publish'];
export default function ManualVsAutomated(props: ModuleProps) {
  const comparison = useRef<HTMLDivElement>(null);
  const [divider, setDivider] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const position = divider ?? [100, 66, 33, 0][props.step]!;
  return (
    <Demo
      {...props}
      title="Manual vs automated"
      subtitle="The same reporting job, two workflows."
      labels={labels}
      onReset={() => {
        setDivider(null);
        setFailed(false);
      }}
    >
      <div ref={comparison} className="demo-compare" style={{ '--divider': `${position}%` } as CSSProperties}>
        <div className="demo-compare-layer" aria-hidden="true">
          <h3>Manual reporting</h3>
          <p className="demo-note">People repeat every step.</p>
          <ol>
            {manual.map((s, i) => (
              <li key={s}>
                {i + 1}. {s}
              </li>
            ))}
          </ol>
        </div>
        <div className="demo-compare-layer demo-compare-after" aria-hidden="true">
          <h3>Automated reporting</h3>
          <p className="demo-note">People review the exceptions.</p>
          <ol>
            {automated.map((s, i) => (
              <li key={s}>
                {i + 1}. {s}
              </li>
            ))}
          </ol>
        </div>
        <div className="demo-divider" aria-hidden="true" />
        <button
          type="button"
          className="demo-drag-handle"
          aria-label="Drag comparison divider; use arrow keys to adjust"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            const rect = comparison.current!.getBoundingClientRect();
            setDivider(Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100))));
          }}
          onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
              e.preventDefault();
              setDivider(Math.max(0, Math.min(100, position + (e.key === 'ArrowRight' ? 5 : -5))));
            }
          }}
        >
          <span aria-hidden="true">↔</span>
        </button>
      </div>
      <Range
        label="Comparison divider"
        value={position}
        min={0}
        max={100}
        display={`${position}% manual / ${100 - position}% automated`}
        onChange={setDivider}
      />
      <div className="demo-toolbar">
        <button className="demo-button" type="button" onClick={() => setDivider(100)}>
          Show manual
        </button>
        <button className="demo-button" type="button" onClick={() => setDivider(50)}>
          Compare both
        </button>
        <button className="demo-button" type="button" onClick={() => setDivider(0)}>
          Show automated
        </button>
      </div>
      <details>
        <summary>Read both workflows</summary>
        <div className="demo-grid">
          <section>
            <h3>Manual</h3>
            <ol>
              {manual.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </section>
          <section>
            <h3>Automated</h3>
            <ol>
              {automated.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </section>
        </div>
      </details>
      <section className="demo-panel">
        <h3>Try the validation gate</h3>
        <p className="demo-note">
          A refresh passes when the difference is at most 0.5% of source revenue. A failed check keeps the
          last validated report live.
        </p>
        <div className="demo-toolbar">
          <button
            type="button"
            className="demo-button"
            aria-pressed={failed}
            onClick={() => setFailed(!failed)}
          >
            {failed ? 'Restore matching totals' : 'Introduce a £100 mismatch'}
          </button>
        </div>
        <Metrics
          items={[
            { label: 'Source revenue', value: '£10,000' },
            { label: 'Incoming report', value: failed ? '£9,900' : '£10,000' },
            { label: 'Tolerance', value: '£50' },
          ]}
        />
        <p className="demo-status" role="status">
          {failed
            ? 'Check failed · £100 difference. Publish blocked; last validated report retained.'
            : 'Check passed · £0 difference. Refresh ready to publish.'}
        </p>
      </section>
    </Demo>
  );
}
