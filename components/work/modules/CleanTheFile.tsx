'use client';
import { useMemo, useState } from 'react';
import { Demo, Metrics } from './Demo';
import { inferTable, sample } from './schema-engine';
import type { ModuleProps } from './types';
export default function CleanTheFile(props: ModuleProps) {
  const [mixed, setMixed] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState('');
  const [showSchema, setShowSchema] = useState(false);
  const result = useMemo(
    () =>
      inferTable({
        headers: sample.headers,
        rows: sample.rows.map((row, i) => row.map((v, j) => (mixed && i === 2 && j === 1 ? 'twelve' : v))),
      }),
    [mixed],
  );
  const json = JSON.stringify(result.schema, null, 2);
  const afterStage = props.step >= 1;
  const validated = props.step >= 2;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied('Schema copied.');
    } catch {
      setCopied('Clipboard unavailable. Select and copy the JSON below.');
    }
  };
  return (
    <Demo
      {...props}
      title="Clean the file"
      subtitle="Infer, standardise and validate a messy sample in your browser."
      labels={['Detect types', 'Standardise', 'Validate', 'Emit schema']}
      onReset={() => {
        setMixed(false);
        setOverrides({});
        setCopied('');
        setShowSchema(false);
      }}
    >
      <div className="demo-toolbar">
        <button
          type="button"
          className="demo-button"
          aria-pressed={mixed}
          onClick={() => {
            setMixed(!mixed);
            setCopied('');
          }}
        >
          {mixed ? 'Restore numeric amount' : 'Try a mixed-type amount'}
        </button>
        <button
          type="button"
          className="demo-button"
          onClick={() => {
            setShowSchema(true);
            props.goTo(3);
          }}
        >
          View schema JSON
        </button>
      </div>
      <p className="demo-note">
        Sample: 6 rows, 4 columns. Slash dates explicitly use DD/MM/YYYY; £ amounts use decimal points and
        comma thousands. Blank and N/A values become null. No values are guessed.
      </p>
      <Metrics
        items={[
          {
            label: validated ? 'Quality after validation' : 'Original quality',
            value: `${validated ? result.score : result.scoreBefore}%`,
          },
          { label: 'Columns inferred', value: String(result.columns.length) },
          { label: 'Cells needing review', value: String(result.unresolved) },
        ]}
      />
      <p className="demo-status" role="status">
        {mixed
          ? 'Mixed amount types detected. The entire amount column stays STRING; “twelve” is preserved for review.'
          : 'Dates, amounts and booleans have consistent inferred types. Two missing values stay null.'}
      </p>
      <div
        className="demo-table-wrap"
        tabIndex={0}
        role="region"
        aria-label="Data table, scroll horizontally for more columns"
      >
        <table className="demo-table">
          <caption>
            Choose Before or After for each column. Scroll horizontally to inspect all columns.
          </caption>
          <thead>
            <tr>
              {result.columns.map((c) => {
                const after = overrides[c.name] ?? afterStage;
                return (
                  <th scope="col" key={c.name}>
                    {c.name}
                    <span className="demo-cell-state">
                      {c.type} · {c.mode}
                    </span>
                    <button
                      type="button"
                      className="demo-button"
                      aria-label={`${c.name}: ${after ? 'After' : 'Before'}. Show ${after ? 'before' : 'after'} values`}
                      aria-pressed={after}
                      onClick={() => setOverrides({ ...overrides, [c.name]: !after })}
                    >
                      {after ? 'After' : 'Before'}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sample.rows.map((_, i) => (
              <tr key={i}>
                {result.columns.map((c) => {
                  const cell = c.cells[i]!;
                  const after = overrides[c.name] ?? afterStage;
                  return (
                    <td
                      key={c.name}
                      className={
                        cell.status === 'missing' || cell.status === 'review' ? 'demo-cell-review' : undefined
                      }
                    >
                      {after ? (cell.after === null ? 'null' : String(cell.after)) : cell.before || '(blank)'}
                      <span className="demo-cell-state">
                        {after
                          ? cell.status
                          : cell.status === 'standardised'
                            ? 'Format to standardise'
                            : cell.status}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details>
        <summary>Why these types?</summary>
        {result.columns.map((c) => (
          <p key={c.name} className="demo-note">
            <strong>{c.name}:</strong> {c.explanation}
          </p>
        ))}
      </details>
      {(props.step === 3 || showSchema) && (
        <section className="demo-panel">
          <div className="demo-toolbar">
            <h3>BigQuery schema</h3>
            <button type="button" className="demo-button" onClick={copy}>
              Copy schema
            </button>
          </div>
          <pre className="demo-code" tabIndex={0} aria-label="Generated BigQuery schema">
            {json}
          </pre>
        </section>
      )}
      <p role="status">{copied}</p>
      <p className="demo-note">
        Quality = cells without format, missing-value or mixed-type issues ÷ all {result.total} cells.
        Nullable fields are loadable but still count as incomplete. This simplified demo processes the
        provided CSV-style sample; it does not upload files.
      </p>
    </Demo>
  );
}
