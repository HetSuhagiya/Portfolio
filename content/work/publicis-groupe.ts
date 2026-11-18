import type { CaseStudy } from '../types.ts';

export const publicisGroupe: CaseStudy = {
  slug: 'publicis-groupe',
  no: '01',
  title: 'Publicis Groupe',
  short: 'Publicis Groupe',
  kind: 'client',
  kindLabel: 'Client work',
  kicker: 'Led end-to-end delivery of a Tableau reporting project',
  summary: 'One Tableau reporting project, owned from data integration to the finished dashboard.',
  when: '2025–26',
  facts: {
    role: 'Data Analyst, delivery lead',
    type: 'Client work at Dashworx',
    period: 'Within Sept 2025 to Nov 2026',
    stack: ['Tableau', 'Data integration', 'Reporting logic', 'KPI implementation'],
  },
  theme: 'ink',
  tint: '#A9B8FF',
  signal: { layout: 'lattice', color: '#A9B8FF', turbulence: 0.12, flow: 0.25, spread: 0.35, scale: 1.05, intensity: 0.8 },
  signalCaption: '// many fine threads, one lattice: enterprise reporting',
  seo: {
    title: 'Publicis Groupe Tableau delivery | Het Suhagiya, Data Analyst, London',
    description:
      'How Het Suhagiya led end-to-end delivery of a Tableau reporting project for Publicis Groupe: data integration, reporting logic, KPI implementation and dashboard development.',
  },
  brief: {
    body: 'A Tableau reporting project for Publicis Groupe, delivered at Dashworx. I led it end to end: data integration, reporting logic, KPI implementation and dashboard development.',
    caption: '// one project, four layers, one owner',
    glyph: 'layers',
  },
  challenge: {
    heading: 'A dashboard is the last layer, not the first.',
    body: 'Under every chart sit integrated data, reporting logic and KPI definitions. When those layers disagree, people stop trusting the number on top. Leading delivery meant owning all of them at once.',
    caption: '// drag the pieces: every layer has its own version of the truth',
    mess: {
      fragments: [
        'export_v3_final.csv',
        'revenue (gross?)',
        'revenue (net?)',
        'week starts Sunday',
        'week starts Monday',
        'region = "EMEA"',
        'region = "emea "',
        'KPI: cost per conversion',
        'KPI: CPA (which one?)',
        'filter: last 7 days',
        'filter: this week',
        'dashboard_draft_2',
      ],
      resolved: ['Integrated data', 'Reporting logic', 'KPI definitions', 'One dashboard'],
      chaosLabel: '// layers that disagree',
      orderLabel: '// four layers, one definition each',
    },
  },
  approach: {
    heading: 'Build the report',
    intro: 'Scroll to assemble a synthetic Tableau-style report the way the real one was delivered: from the data up.',
    module: 'build-the-report',
    moduleTitle: 'Build the report',
    alt: 'An illustrative dashboard built from synthetic marketing data. It assembles in four steps (data integration, reporting logic, KPI implementation, dashboard). Once complete, selecting a bar cross-filters every other chart, and the breakdown can be switched between brand, region and channel.',
    caption: '// kickoff to delivery, one layer at a time',
    chapters: [
      {
        title: 'Data integration',
        body: 'Bring every source into one consistent dataset before anything is drawn.',
      },
      {
        title: 'Reporting logic',
        body: 'Decide how rows become report lines: filters, date handling, groupings.',
      },
      {
        title: 'KPI implementation',
        body: 'Give each KPI a single calculation, so every view reads from the same definition.',
      },
      {
        title: 'Dashboard development',
        body: 'Only now, charts. Click a bar to cross-filter. Switch the breakdown. Hover for detail.',
      },
    ],
  },
  build: {
    heading: 'From sources to a dashboard people can filter',
    body: 'The delivery ran in one direction: integrate, define the logic, implement the KPIs, then build the dashboards on top. Each layer feeds the next, so a fix happens once.',
    diagram: {
      caption: '// each layer reads only from the one before it',
      nodes: [
        { id: 'src', label: 'Source data', sub: 'multiple inputs', col: 0, row: 0 },
        { id: 'int', label: 'Data integration', sub: 'one dataset', col: 1, row: 0 },
        { id: 'logic', label: 'Reporting logic', sub: 'filters, dates, groups', col: 2, row: 0 },
        { id: 'kpi', label: 'KPI implementation', sub: 'one calc per KPI', col: 3, row: 0 },
        { id: 'dash', label: 'Tableau dashboards', sub: 'delivered', col: 4, row: 0, decision: true },
      ],
      edges: [
        ['src', 'int'],
        ['int', 'logic'],
        ['logic', 'kpi'],
        ['kpi', 'dash'],
      ],
    },
    snippet: {
      lang: 'sql',
      title: 'kpi_weekly.sql',
      caption: '// illustrative snippet, generic names, no client data',
      code: `-- One definition per KPI, reused by every view
CREATE OR REPLACE VIEW reporting.kpi_weekly AS
SELECT
  DATE_TRUNC(activity_date, WEEK(MONDAY)) AS week_start,
  brand,
  region,
  channel,
  SUM(spend)        AS spend,
  SUM(conversions)  AS conversions,
  SAFE_DIVIDE(SUM(spend), SUM(conversions)) AS cost_per_conversion
FROM reporting.unified_activity
GROUP BY 1, 2, 3, 4;`,
      notes: [
        { line: 4, text: 'One calendar for the whole report.' },
        { line: 10, text: 'Ratios are computed after aggregation, never averaged.' },
        { line: 11, text: 'Every chart reads from the integrated dataset.' },
      ],
    },
  },
  outcome: {
    heading: 'Delivered, end to end',
    body: 'A Tableau reporting project for Publicis Groupe, led from data integration through reporting logic and KPI implementation to dashboard development.',
    stats: [],
  },
  learned: {
    body: 'Leading delivery taught me to settle metric definitions before building anything visual. Next time I would put a rough draft in front of stakeholders even earlier.',
  },
};
