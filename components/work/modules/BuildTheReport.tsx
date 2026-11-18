'use client';
import { useState, type CSSProperties } from 'react';
import { Demo, Choice, Metrics } from './Demo';
import { marketing, marketingTotals, groupMarketing, money, number, type Dimension } from './demo-data';
import type { ModuleProps } from './types';
const labels = ['Integrate', 'Define logic', 'Calculate KPIs', 'Explore report'];
const descriptions = [
  '162 synthetic source rows share brand, region, channel and month fields. Inspect a sample below.',
  'The report groups rows by the selected dimension. A selected bar filters every other view.',
  'Cost per conversion = total spend ÷ total conversions. Ratios are calculated after aggregation.',
  'Select a bar to investigate a segment. Select it again, or clear the selection, to see the whole report.',
];
export default function BuildTheReport(props: ModuleProps) {
  const [preview, setPreview] = useState(false);
  const stage = preview ? 3 : props.step;
  const [dimension, setDimension] = useState<Dimension>('brand');
  const [selected, setSelected] = useState<string | null>(null);
  const rows = marketing.filter((r) => !selected || r[dimension] === selected);
  const totals = marketingTotals(rows);
  const bars = groupMarketing(marketing, dimension);
  const trend = groupMarketing(rows, 'month');
  const channels = groupMarketing(rows, 'channel');
  const max = Math.max(...bars.map((b) => b.conversions));
  return (
    <Demo
      {...props}
      step={stage}
      title="Build the report"
      subtitle="One dataset. Every view agrees."
      labels={labels}
      onReset={() => {
        setPreview(false);
        setDimension('brand');
        setSelected(null);
      }}
    >
      <p className="demo-status">{descriptions[stage]}</p>
      {stage < 3 && (
        <button type="button" className="demo-button" onClick={() => setPreview(true)}>
          Explore finished report
        </button>
      )}
      {stage === 0 && (
        <Metrics
          items={[
            { label: 'Integrated rows', value: '162' },
            { label: 'Source channels', value: '3' },
            { label: 'Months aligned', value: '6' },
          ]}
        />
      )}
      {stage >= 1 && (
        <>
          <Choice
            label="Break down conversions by"
            value={dimension}
            onChange={(d) => {
              setDimension(d);
              setSelected(null);
            }}
            options={(['brand', 'region', 'channel'] as const).map((value) => ({
              value,
              label: value[0]!.toUpperCase() + value.slice(1),
            }))}
          />
          {stage >= 2 && (
            <Metrics
              items={[
                { label: 'Spend', value: money(totals.spend) },
                { label: 'Conversions', value: number(totals.conversions) },
                { label: 'Cost / conversion', value: `£${totals.cpa.toFixed(2)}` },
              ]}
            />
          )}
          {stage === 2 && (
            <p className="demo-status">
              {money(totals.spend)} spend ÷ {number(totals.conversions)} conversions = £
              {totals.cpa.toFixed(2)} per conversion. Every chart uses this definition.
            </p>
          )}
          {stage >= 3 && (
            <>
              <div className="demo-grid">
                <section className="demo-panel">
                  <h3>Conversions by {dimension}</h3>
                  <div className="demo-bars">
                    {bars.map((b) => (
                      <button
                        className="demo-bar"
                        type="button"
                        key={b.label}
                        aria-pressed={selected === b.label}
                        onClick={() => setSelected(selected === b.label ? null : b.label)}
                      >
                        <span
                          className="demo-bar-fill"
                          aria-hidden="true"
                          style={{ '--bar-width': `${(b.conversions / max) * 100}%` } as CSSProperties}
                        />
                        <span>{b.label}</span>
                        <strong>{number(b.conversions)}</strong>
                      </button>
                    ))}
                  </div>
                </section>
                <section className="demo-panel">
                  <h3>Monthly conversions</h3>
                  <div className="demo-bars">
                    {trend.map((b) => (
                      <div className="demo-bar" key={b.label}>
                        <span
                          className="demo-bar-fill"
                          aria-hidden="true"
                          style={
                            {
                              '--bar-width': `${(b.conversions / Math.max(...trend.map((t) => t.conversions))) * 100}%`,
                            } as CSSProperties
                          }
                        />
                        <span>{b.label}</span>
                        <strong>{number(b.conversions)}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <div className="demo-toolbar">
                <p role="status">
                  {selected
                    ? `${selected}: ${rows.length} rows included.`
                    : `All segments: ${rows.length} rows included.`}
                </p>
                <button type="button" className="demo-button" onClick={() => setSelected(null)}>
                  Clear selection
                </button>
              </div>
            </>
          )}
          <div
            className="demo-table-wrap"
            tabIndex={0}
            role="region"
            aria-label="Data table, scroll horizontally for more columns"
          >
            <table className="demo-table">
              <caption>Channel performance · current selection</caption>
              <thead>
                <tr>
                  <th scope="col">Channel</th>
                  <th scope="col">Spend</th>
                  <th scope="col">Conversions</th>
                  <th scope="col">Cost / conversion</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((r) => (
                  <tr key={r.label}>
                    <th scope="row">{r.label}</th>
                    <td>{money(r.spend)}</td>
                    <td>{number(r.conversions)}</td>
                    <td>£{r.cpa.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <details open={stage === 0 || undefined}>
        <summary>Inspect source rows</summary>
        <div
          className="demo-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Data table, scroll horizontally for more columns"
        >
          <table className="demo-table">
            <caption>First six rows of the current selection</caption>
            <thead>
              <tr>
                {['Month', 'Brand', 'Region', 'Channel', 'Spend', 'Conversions'].map((h) => (
                  <th scope="col" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 6).map((r, i) => (
                <tr key={i}>
                  <td>{r.month}</td>
                  <td>{r.brand}</td>
                  <td>{r.region}</td>
                  <td>{r.channel}</td>
                  <td>{money(r.spend)}</td>
                  <td>{r.conversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </Demo>
  );
}
