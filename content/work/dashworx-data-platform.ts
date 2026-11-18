import type { CaseStudy } from '../types.ts';

export const dashworxDataPlatform: CaseStudy = {
  slug: 'dashworx-data-platform',
  no: '04',
  title: 'Dashworx Data Platform',
  short: 'Dashworx Data Platform',
  kind: 'client',
  kindLabel: 'Client work',
  kicker: 'The role: 10+ client accounts, end to end',
  summary: 'Sources to BigQuery to BI, for every account. Connect, Own, Act as a daily practice.',
  when: '2025–26',
  facts: {
    role: 'Data Analyst',
    type: 'Role at Dashworx, London',
    period: 'Sept 2025 to Nov 2026',
    stack: ['SQL', 'BigQuery', 'Funnel.io', 'GA4', 'Tableau', 'Looker Studio'],
  },
  theme: 'ink',
  tint: '#5CF2D6',
  signal: { layout: 'pipeline', color: '#5CF2D6', turbulence: 0.1, flow: 0.4, spread: 0.3, intensity: 0.95 },
  signalCaption: '// the pipeline itself: connect, own, act',
  seo: {
    title: 'Dashworx data platform, 10+ client accounts | Het Suhagiya, Data Analyst, London',
    description:
      'End-to-end analytics delivery across 10+ client accounts at Dashworx: Funnel.io integrations, BigQuery SQL views, validation and reconciliation, Tableau and Looker Studio dashboards.',
  },
  brief: {
    body: 'Dashworx is an AI data analytics and decision velocity platform for marketing and eCommerce teams. As a Data Analyst there, I managed end-to-end analytics delivery across 10+ client accounts: data solutions, KPI frameworks and BI dashboards.',
    caption: '// one pipeline, repeated for every account',
    glyph: 'pipeline',
  },
  challenge: {
    heading: 'Ten sources. Ten versions of yesterday.',
    body: 'Each client brings 10+ data sources, including GA4, Google Ads, Meta Ads and Shopify. Each platform counts in its own way. Before a dashboard can be trusted, the source and the report have to agree.',
    caption: '// drag the pieces: every platform has its own number',
    mess: {
      fragments: [
        'GA4: 1,284',
        'Shopify: 1,311',
        'Meta Ads: 402',
        'Google Ads: 377',
        'UTC',
        'Europe/London',
        'GBP',
        'USD',
        '7-day click',
        '1-day view',
        'duplicate order?',
        'dashboard: 1,297',
      ],
      resolved: ['Connect: sources integrated', 'Own: one calculation per metric', 'Act: a number people use'],
      chaosLabel: '// same day, different answers',
      orderLabel: '// connect → own → act',
    },
  },
  approach: {
    heading: 'Follow the data',
    intro: 'Select any stage of the pipeline to see what I did there. Then try the part of the job that rarely gets shown: finding out why two numbers disagree.',
    module: 'follow-the-data',
    moduleTitle: 'Follow the data',
    alt: 'A clickable pipeline diagram: sources (GA4, Google Ads, Meta Ads, Shopify) flow into Funnel.io, then BigQuery views, then Tableau and Looker Studio. Selecting a stage shows the work done there. A short game follows: compare a source number with a dashboard number, inspect synthetic rows, choose the cause of the discrepancy, and watch the numbers reconcile.',
    caption: '// sources → Funnel.io → BigQuery views → Tableau / Looker Studio',
    chapters: [
      {
        title: 'Connect',
        body: 'Integrated and validated 10+ data sources per client using Funnel.io: GA4, Google Ads, Meta Ads, Shopify.',
      },
      {
        title: 'Own',
        body: 'Built and maintained SQL views in BigQuery: transformations, business logic, consistent metric calculations.',
      },
      {
        title: 'Act',
        body: 'Tableau and Looker Studio dashboards for commercial performance, trends and actionable insight.',
      },
      {
        title: 'Find the discrepancy',
        body: 'Investigate the anomaly, reconcile source against report, validate the KPI. Your turn.',
      },
    ],
  },
  build: {
    heading: 'The same shape for every account',
    body: 'Source platforms land through Funnel.io. SQL views in BigQuery hold the transformations and business logic. Dashboards read from the views, so a metric is calculated once and shown everywhere.',
    diagram: {
      caption: '// connect → own → act',
      nodes: [
        { id: 'ga4', label: 'GA4', col: 0, row: 0 },
        { id: 'gads', label: 'Google Ads', col: 0, row: 1 },
        { id: 'meta', label: 'Meta Ads', col: 0, row: 2 },
        { id: 'shop', label: 'Shopify', col: 0, row: 3 },
        { id: 'funnel', label: 'Funnel.io', sub: 'integrate + validate', col: 1, row: 1.5 },
        { id: 'bq', label: 'BigQuery views', sub: 'logic + metrics', col: 2, row: 1.5 },
        { id: 'tab', label: 'Tableau', col: 3, row: 1, decision: true },
        { id: 'looker', label: 'Looker Studio', col: 3, row: 2, decision: true },
      ],
      edges: [
        ['ga4', 'funnel'],
        ['gads', 'funnel'],
        ['meta', 'funnel'],
        ['shop', 'funnel'],
        ['funnel', 'bq'],
        ['bq', 'tab'],
        ['bq', 'looker'],
      ],
    },
    snippet: {
      lang: 'sql',
      title: 'orders_clean.sql',
      caption: '// illustrative snippet, generic names, no client data',
      code: `-- One row per order, one currency, one timezone
CREATE OR REPLACE VIEW marts.orders_clean AS
SELECT
  o.order_id,
  DATE(o.created_at, 'Europe/London')   AS order_date,
  ROUND(o.amount * fx.rate_to_gbp, 2)   AS revenue_gbp
FROM staging.orders AS o
JOIN staging.fx_rates AS fx
  ON  fx.currency  = o.currency
  AND fx.rate_date = DATE(o.created_at)
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY o.order_id ORDER BY o.updated_at DESC
) = 1;`,
      notes: [
        { line: 5, text: 'Timezone: report days match the business day.' },
        { line: 6, text: 'Currency: converted once, at the model layer.' },
        { line: 11, text: 'Duplicates: only the latest version of each order survives.' },
      ],
    },
  },
  outcome: {
    heading: 'What the role added up to',
    body: 'End-to-end analytics delivery for marketing and eCommerce clients including Publicis Groupe, Pantherella International Group and Christopher Ward.',
    stats: [
      { value: 10, suffix: '+', label: 'client accounts, end to end' },
      { value: 10, suffix: '+', label: 'data sources integrated per client' },
    ],
  },
  learned: {
    body: 'Most of the value sits in the unglamorous middle: validation and reconciliation. Next I would turn my recurring checks into automated tests that run with every refresh.',
  },
};
