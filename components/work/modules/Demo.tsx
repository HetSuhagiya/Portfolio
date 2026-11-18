'use client';
import type { ReactNode } from 'react';
import type { ModuleProps } from './types';
import './demos.css';

export function Demo({
  title,
  subtitle,
  children,
  onReset,
  pinned,
  step,
  labels,
}: Pick<ModuleProps, 'step' | 'pinned'> & {
  title: string;
  subtitle: string;
  labels: string[];
  children: ReactNode;
  onReset: () => void;
}) {
  return (
    <div className="demo" data-pinned={pinned || undefined}>
      <header className="demo-header">
        <div>
          <p className="text-caption">{`// ${title}`}</p>
          <p className="demo-subtitle">{subtitle}</p>
        </div>
        <button type="button" className="demo-button" onClick={onReset}>
          Reset demo
        </button>
      </header>
      <ol className="demo-stages" aria-label="Demo stages">
        {labels.map((label, i) => (
          <li key={label} aria-current={i === step ? 'step' : undefined}>
            <span>{String(i + 1).padStart(2, '0')}</span> {label}
          </li>
        ))}
      </ol>
      <div
        className="demo-body"
        data-lenis-prevent
        tabIndex={0}
        role="region"
        aria-label={`${title} interactive workspace`}
      >
        <div className="demo-content">{children}</div>
      </div>
      <p className="demo-footnote">
        Illustrative demo · Synthetic data ·{' '}
        {pinned ? 'Scroll inside for more controls' : 'Explore any control at any stage'}
      </p>
    </div>
  );
}
export function Metrics({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="demo-metrics">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="demo-choice">
      <legend>{label}</legend>
      <div>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className="demo-button"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
export function Range({
  label,
  value,
  min,
  max,
  step = 1,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display: string;
  onChange: (n: number) => void;
}) {
  return (
    <label className="demo-range">
      <span>
        {label}
        <strong>{display}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={display}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
