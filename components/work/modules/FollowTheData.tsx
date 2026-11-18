'use client';
import { useState } from 'react';
import { Demo, Metrics } from './Demo';
import { reconciliationRows, reconcile, money } from './demo-data';
import type { ModuleProps } from './types';
const stages = [
  {
    title: 'Sources',
    sub: 'GA4 · Ads · Shopify',
    body: 'Source platforms count different events. Capture the business date, currency and unique order ID before combining rows.',
  },
  {
    title: 'Funnel.io',
    sub: 'Connect & validate',
    body: 'Bring source exports into a consistent shape and check that expected fields and refreshes are present.',
  },
  {
    title: 'BigQuery',
    sub: 'Own the logic',
    body: 'SQL views standardise dates and currencies, remove duplicate orders and calculate each metric once.',
  },
  {
    title: 'BI dashboards',
    sub: 'Tableau · Looker',
    body: 'Publish the validated model to dashboards. Investigate a mismatch before trusting the number on a chart.',
  },
];
const causes = ['Duplicate order', 'Currency mismatch', 'Different reporting day'];
const totals = reconcile(reconciliationRows);
export default function FollowTheData(props: ModuleProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [fixed, setFixed] = useState(false);
  const active = selected ?? [1, 2, 3, 2][props.step]!;
  const correct = answer === causes[0];
  return (
    <Demo
      {...props}
      title="Follow the data"
      subtitle="Find where the number changes, then explain why."
      labels={['Connect', 'Own', 'Act', 'Reconcile']}
      onReset={() => {
        setSelected(null);
        setAnswer(null);
        setFixed(false);
      }}
    >
      <div className="demo-pipeline" role="group" aria-label="Pipeline stages">
        {stages.map((s, i) => (
          <button
            type="button"
            className="demo-button"
            key={s.title}
            aria-pressed={active === i}
            onClick={() => setSelected(i)}
          >
            {i + 1}. {s.title}
            <small>{s.sub}</small>
          </button>
        ))}
      </div>
      <p className="demo-status">
        <strong>{stages[active]!.title}: </strong>
        {stages[active]!.body}
      </p>
      <section className="demo-panel">
        <h3>The dashboard doesn’t match. Why?</h3>
        <Metrics
          items={[
            { label: 'Source revenue', value: money(totals.clean) },
            { label: 'Dashboard revenue', value: money(fixed ? totals.clean : totals.raw) },
            { label: 'Difference', value: money(fixed ? 0 : totals.raw - totals.clean) },
          ]}
        />
        <p className="demo-note">Inspect the incoming rows. The source counts each order once.</p>
        <div
          className="demo-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Data table, scroll horizontally for more columns"
        >
          <table className="demo-table">
            <caption>
              Incoming export · {fixed ? 'duplicate excluded from the report' : 'all rows currently included'}
            </caption>
            <thead>
              <tr>
                {['Order', 'Date', 'Currency', 'Amount', 'Check'].map((h) => (
                  <th scope="col" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reconciliationRows.map((r, i) => (
                <tr key={i}>
                  <th scope="row">{r.id}</th>
                  <td>{r.date}</td>
                  <td>{r.currency}</td>
                  <td>{money(r.amount)}</td>
                  <td>
                    {i === 3 && (correct || fixed)
                      ? fixed
                        ? 'Excluded: duplicate'
                        : 'Repeated order ID'
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <fieldset className="demo-choice">
        <legend>Choose the cause</legend>
        <div>
          {causes.map((c) => (
            <button
              type="button"
              className="demo-button"
              key={c}
              aria-pressed={answer === c}
              onClick={() => {
                setAnswer(c);
                setFixed(false);
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </fieldset>
      <p role="status" className="demo-status">
        {fixed
          ? `Reconciled. ${totals.removed} duplicate excluded; both totals are ${money(totals.clean)}.`
          : correct
            ? 'Correct. Order 1043 appears twice, adding £210 to the dashboard.'
            : answer === causes[1]
              ? 'All rows are in GBP, so conversion cannot explain this difference. Compare order IDs and try again.'
              : answer === causes[2]
                ? 'All rows use the same reporting day. Look for an order counted more than once and try again.'
                : 'Compare IDs, currencies and dates, then choose a cause.'}
      </p>
      {correct && !fixed && (
        <button className="demo-button" type="button" onClick={() => setFixed(true)}>
          Exclude duplicate and reconcile
        </button>
      )}
    </Demo>
  );
}
