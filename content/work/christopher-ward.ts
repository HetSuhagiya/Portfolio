import type { CaseStudy } from '../types.ts';

export const christopherWard: CaseStudy = {
  slug: 'christopher-ward',
  no: '03',
  title: 'Christopher Ward',
  short: 'Christopher Ward',
  kind: 'client',
  kindLabel: 'Client work',
  kicker: 'Reporting automation',
  summary: 'From a manual reporting week to numbers that refresh and validate themselves.',
  when: '2025–26',
  facts: {
    role: 'Data Analyst',
    type: 'Client work at Dashworx',
    period: 'Within Sept 2025 to Nov 2026',
    stack: ['BigQuery', 'SQL views', 'Funnel.io', 'Looker Studio'],
    stackLabel: 'Stack (role-wide) [EDIT: confirm for this account]',
  },
  theme: 'paper',
  tint: '#1B2A4A',
  signal: { layout: 'thread', color: '#1B2A4A', turbulence: 0.04, flow: 0.08, spread: 0.2, intensity: 0.9, fluid: 0.5 },
  signalCaption: '// one fine line, unhurried: precision over speed',
  seo: {
    title: 'Christopher Ward reporting automation | Het Suhagiya, Data Analyst, London',
    description:
      'Reporting automation for the Christopher Ward account: a draggable comparison of a manual reporting week and an automated, validated pipeline. Illustrative, synthetic data.',
  },
  brief: {
    body: 'Christopher Ward is one of the 10+ client accounts I managed at Dashworx. Reporting automation is a core part of how I work: scheduled data, validated views and dashboards that stay current. [EDIT: confirm the automation work specific to this account]',
    caption: '// time is the metric on this page',
    glyph: 'clock',
  },
  challenge: {
    heading: 'The report that eats the week.',
    body: 'Manual reporting follows a familiar loop: export, paste, fix, check, send, repeat. Every step is a place for a number to drift, and none of the effort carries over to next week.',
    caption: '// drag the pieces: one week of manual reporting',
    mess: {
      fragments: [
        'export.csv',
        'export (1).csv',
        'copy',
        'paste',
        'fix formula',
        '#REF!',
        'report_v2.xlsx',
        'report_v2_FINAL.xlsx',
        'check totals',
        'send',
        'repeat on Monday',
      ],
      resolved: ['Scheduled refresh', 'Validated views', 'Live dashboard'],
      chaosLabel: '// eleven manual steps, every week',
      orderLabel: '// three automated stages',
    },
  },
  approach: {
    heading: 'Manual week vs automated',
    intro: 'Drag the handle. On the left, the manual week. On the right, the same reporting once it is automated.',
    module: 'manual-vs-automated',
    moduleTitle: 'Manual week vs automated',
    alt: 'A before and after comparison with a draggable divider. Before: a manual reporting workflow of spreadsheets, copy and paste, and a clock that keeps ticking. After: an automated pipeline of scheduled refresh, validated views and a dashboard. The divider can also be moved with the arrow keys or the two buttons.',
    caption: '// the same report, two ways of producing it',
    chapters: [
      { title: 'The manual week', body: 'Exports, copy and paste, formula fixes. The clock runs the whole time.' },
      { title: 'Schedule the data', body: 'Sources refresh on a schedule instead of on request.' },
      { title: 'Validate in the model', body: 'Checks live in SQL views, so every refresh is tested the same way.' },
      { title: 'Let the dashboard update', body: 'The report is always current. Time goes to reading it, not building it.' },
    ],
  },
  build: {
    heading: 'Automation is validation you only write once',
    body: 'A report can refresh itself only if it can also check itself. The views that calculate each metric carry the validation, so a discrepancy is caught before anyone opens the dashboard.',
    diagram: {
      caption: '// nothing reaches the dashboard unvalidated',
      nodes: [
        { id: 'src', label: 'Source platforms', sub: 'scheduled sync', col: 0, row: 0 },
        { id: 'funnel', label: 'Funnel.io', sub: 'integration', col: 1, row: 0 },
        { id: 'views', label: 'BigQuery views', sub: 'logic + checks', col: 2, row: 0 },
        { id: 'dash', label: 'Looker Studio', sub: 'always current', col: 3, row: 0, decision: true },
      ],
      edges: [
        ['src', 'funnel'],
        ['funnel', 'views'],
        ['views', 'dash'],
      ],
    },
    snippet: {
      lang: 'sql',
      title: 'daily_reconciliation.sql',
      caption: '// illustrative snippet, generic names, no client data',
      code: `-- A check that runs with every refresh
SELECT
  report_date,
  source_revenue,
  report_revenue,
  ABS(source_revenue - report_revenue) AS difference,
  ABS(source_revenue - report_revenue)
    <= 0.005 * source_revenue          AS within_tolerance
FROM checks.daily_reconciliation
WHERE report_date = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY);`,
      notes: [
        { line: 4, text: 'What the source platform says.' },
        { line: 5, text: 'What the report says.' },
        { line: 8, text: 'A stated tolerance, so "close enough" is defined once.' },
      ],
    },
  },
  outcome: {
    heading: 'Reporting that runs without a reporter',
    body: 'Automated reporting built on validated SQL views and dashboards, part of delivering analytics across 10+ client accounts at Dashworx.',
    stats: [],
    edit: '[EDIT: add an hours-saved figure here only if it was your work and can be shared. Delete this note otherwise.]',
  },
  learned: {
    body: '[EDIT: draft] Automation moves the effort from producing a report to trusting it. Next I would add alerting on the validation checks, so a failed check reaches me before it reaches a client.',
  },
};
