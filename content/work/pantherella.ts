import type { CaseStudy } from '../types.ts';

export const pantherella: CaseStudy = {
  slug: 'pantherella',
  no: '02',
  title: 'Pantherella International Group',
  short: 'Pantherella',
  kind: 'client',
  kindLabel: 'Client work',
  kicker: 'KPI frameworks and BI dashboards across the account',
  summary: 'Making performance explainable: every number traced back to the drivers behind it.',
  when: '2025–26',
  facts: {
    role: 'Data Analyst',
    type: 'Client work at Dashworx',
    period: 'Within Sept 2025 to Nov 2026',
    stack: ['KPI frameworks', 'BI dashboards', 'BigQuery', 'Looker Studio'],
    stackLabel: 'Stack (role-wide) [EDIT: confirm for this account]',
  },
  theme: 'ink',
  tint: '#E29C86',
  signal: { layout: 'thread', color: '#E29C86', turbulence: 0.08, flow: 0.14, spread: 0.55, intensity: 0.85 },
  signalCaption: '// one warm, slow thread: a single line of reasoning',
  seo: {
    title: 'Pantherella KPI frameworks | Het Suhagiya, Data Analyst, London',
    description:
      'KPI frameworks and BI dashboards for the Pantherella International Group account, shown through an interactive metric tree built on synthetic data.',
  },
  brief: {
    body: 'Pantherella International Group is one of the 10+ client accounts I managed at Dashworx, delivering data solutions, KPI frameworks and BI dashboards. [EDIT: confirm the specific work done for this account. Until then, this page shows the kind of framework I built across accounts.]',
    caption: '// a framework, not a list of numbers',
    glyph: 'tree',
  },
  challenge: {
    heading: 'A number moved. Nobody can say why.',
    body: 'Metrics on a dashboard are easy to read and hard to explain. Without a framework, revenue, sessions and conversion sit side by side with no stated relationship between them.',
    caption: '// drag the pieces: metrics with no relationships',
    mess: {
      fragments: [
        'Revenue ↓',
        'Sessions ↑',
        'Conversion ?',
        'AOV ~',
        'Paid social',
        'Email',
        'Organic',
        'Paid search',
        'Product mix',
        'Returning customers',
      ],
      resolved: ['Revenue', '= Sessions', '× Conversion', '× AOV'],
      chaosLabel: '// ten metrics, zero structure',
      orderLabel: '// one equation, readable top to bottom',
    },
  },
  approach: {
    heading: 'The KPI tree',
    intro: 'A metric tree turns a headline number into its drivers. Change one input and watch the effect travel upward.',
    module: 'kpi-tree',
    moduleTitle: 'The KPI tree',
    alt: 'An interactive metric tree on synthetic data. Revenue is calculated as sessions multiplied by conversion rate multiplied by average order value, with sessions broken down by channel and order value by product group. Moving any slider recalculates every connected node.',
    caption: '// revenue = sessions × conversion × AOV',
    chapters: [
      { title: 'Start with the outcome', body: 'One headline number the business cares about.' },
      { title: 'Decompose it', body: 'Sessions, conversion rate and average order value multiply into revenue.' },
      { title: 'Break down the drivers', body: 'Each driver splits by channel or product group.' },
      { title: 'Explain a change', body: 'Drag any slider. The tree shows exactly where the movement comes from.' },
    ],
  },
  build: {
    heading: 'A framework lives in the model, not in the chart',
    body: 'The tree only works when each driver is calculated once, in one place. The dashboard then reads the framework; it never redefines it.',
    diagram: {
      caption: '// drivers are modelled once, then visualised',
      nodes: [
        { id: 'src', label: 'Sources', sub: 'traffic, orders', col: 0, row: 0 },
        { id: 'drivers', label: 'Driver metrics', sub: 'sessions, CVR, AOV', col: 1, row: 0 },
        { id: 'tree', label: 'KPI framework', sub: 'how they combine', col: 2, row: 0 },
        { id: 'dash', label: 'BI dashboard', sub: 'explainable KPIs', col: 3, row: 0, decision: true },
      ],
      edges: [
        ['src', 'drivers'],
        ['drivers', 'tree'],
        ['tree', 'dash'],
      ],
    },
    snippet: {
      lang: 'sql',
      title: 'revenue_drivers.sql',
      caption: '// illustrative snippet, generic names, no client data',
      code: `-- Revenue decomposed into the three drivers that multiply into it
SELECT
  week_start,
  channel,
  SUM(sessions)                              AS sessions,
  SAFE_DIVIDE(SUM(orders), SUM(sessions))    AS conversion_rate,
  SAFE_DIVIDE(SUM(revenue), SUM(orders))     AS avg_order_value,
  SUM(revenue)                               AS revenue
FROM analytics.channel_weekly
GROUP BY 1, 2;`,
      notes: [
        { line: 5, text: 'Driver one: how many people arrived.' },
        { line: 6, text: 'Driver two: how many of them bought.' },
        { line: 7, text: 'Driver three: how much each order was worth.' },
        { line: 8, text: 'The three drivers multiply back to this number.' },
      ],
    },
  },
  outcome: {
    heading: 'Performance that explains itself',
    body: 'KPI frameworks and BI dashboards delivered as part of managing analytics across 10+ client accounts at Dashworx.',
    stats: [{ value: 10, suffix: '+', label: 'client accounts managed at Dashworx' }],
    edit: '[EDIT: add a result specific to this account only if it can be shared. Delete this note otherwise.]',
  },
  learned: {
    body: '[EDIT: draft] A KPI framework is a communication tool before it is a data model. Next I would agree the tree with stakeholders on paper before writing any SQL.',
  },
};
