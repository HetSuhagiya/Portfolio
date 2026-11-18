/**
 * Copy and synthetic data for the "Ask your data" module (/work/ai-dashboard-generator).
 *
 * Everything here is scripted. No model is called and no real data is read: each series is
 * generated in the browser from the fixed `seed` below, so the demo looks the same on every visit.
 */

export type AskUnit = 'gbp' | 'int' | 'pct' | 'x';

/** One synthetic daily series (56 days). `base` is the typical daily value. */
export type AskSeries = {
  id: string;
  unit: AskUnit;
  /** How days combine into weeks and totals: money and counts add up, rates and averages do not. */
  agg: 'sum' | 'mean';
  base: number;
  seed: number;
};

export type AskTile = {
  id: string;
  title: string;
  kind: 'kpi' | 'bar' | 'line' | 'area';
  /** The series this tile reads. A KPI and a chart that share a series always agree. */
  series: string;
  /** Split the series total across the preset's `categories` instead of plotting it over time. */
  split?: boolean;
  /** Width in grid columns. */
  span: 1 | 2;
};

export type AskPreset = {
  id: string;
  /** Short label on the preset button. */
  label: string;
  /** The requirement that is "typed" into the prompt box. */
  prompt: string;
  /** Name of the dimension in `categories`, used in descriptions ("by channel"). */
  dimension: string;
  categories: string[];
  series: AskSeries[];
  /** Exactly five tiles: the build sequence is timed for five. */
  tiles: AskTile[];
  /** Generic, illustrative SQL shown while the build streams. No client tables or fields. */
  sql: string;
};

export const askYourData = {
  labels: {
    promptLabel: 'Requirement in plain English. This demo is scripted: choose one of the preset prompts, then run it.',
    presets: 'Preset prompts',
    run: 'Run',
    running: 'Building',
    rerun: 'Run again',
    pipeline: 'Pipeline',
    timelapse: 'time-lapse ×4',
    dashboard: 'Generated dashboard, synthetic data',
    empty: '// the dashboard is generated here',
    plan: 'plan',
    edit: 'Edit tile',
    drag: 'Drag',
    resize: 'Resize',
    moveEarlier: 'Move earlier',
    moveLater: 'Move later',
    wider: 'Wider',
    narrower: 'Narrower',
    chartType: 'Chart type',
    followUp: 'Follow-up',
    followUpHint: '// edit only this tile with a prompt',
    close: 'Close',
    total: 'total',
    average: 'avg',
    versus: 'vs the weeks before',
    weeks8: '8 weeks',
    weeks4: 'last 4 weeks',
    daily: 'daily',
    weekly: 'weekly',
  },
  /** Mirrors the architecture diagram further down the page. */
  stages: ['Natural language', 'Vertex AI', 'BigQuery SQL', 'Chart specs', 'Dashboard'],
  status: {
    idle: 'Scripted demo. Choose a prompt, then press Enter.',
    running: [
      'Reading the requirement',
      'Vertex AI is planning the dashboard',
      'Generating BigQuery SQL',
      'Writing one spec per chart',
      'Rendering the tiles',
    ],
    done: 'Built in about 30 seconds, shown here as a time-lapse. Every tile is now editable on its own.',
    donePointer: 'Hover or focus a tile to move it, resize it, switch its chart or re-prompt it.',
  },
  /** Follow-up prompts offered on a tile. Each one changes that tile only. */
  followUps: {
    weekly: 'make this weekly',
    daily: 'make this daily',
    recent: 'only the last 4 weeks',
    all: 'show all 8 weeks',
    sort: 'sort high to low',
    unsort: 'back to the original order',
    top: 'top 3 only',
    every: 'show all of them',
  },
  presets: [
    {
      id: 'revenue',
      label: 'Revenue by channel',
      prompt: 'Show revenue by channel for the last 8 weeks, with conversion rate and average order value',
      dimension: 'channel',
      categories: ['Search', 'Social', 'Email', 'Direct', 'Display'],
      series: [
        { id: 'revenue', unit: 'gbp', agg: 'sum', base: 3300, seed: 14 },
        { id: 'cvr', unit: 'pct', agg: 'mean', base: 2.8, seed: 12 },
        { id: 'aov', unit: 'gbp', agg: 'mean', base: 64, seed: 15 },
      ],
      tiles: [
        { id: 'k-revenue', title: 'Revenue', kind: 'kpi', series: 'revenue', span: 1 },
        { id: 'k-cvr', title: 'Conversion rate', kind: 'kpi', series: 'cvr', span: 1 },
        { id: 'c-channel', title: 'Revenue by channel', kind: 'bar', series: 'revenue', split: true, span: 2 },
        { id: 'c-revenue', title: 'Revenue over time', kind: 'area', series: 'revenue', span: 2 },
        { id: 'c-aov', title: 'Average order value', kind: 'line', series: 'aov', span: 2 },
      ],
      sql: `SELECT channel, order_date,
       SUM(revenue) AS revenue,
       SAFE_DIVIDE(SUM(orders), SUM(sessions)) AS conversion_rate,
       SAFE_DIVIDE(SUM(revenue), SUM(orders)) AS avg_order_value
FROM demo.daily_performance
WHERE order_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 8 WEEK)
GROUP BY channel, order_date`,
    },
    {
      id: 'paid',
      label: 'Paid media',
      prompt: 'How is paid media performing? Spend and orders by channel, with ROAS over time',
      dimension: 'channel',
      categories: ['Paid search', 'Paid social', 'Shopping', 'Display'],
      series: [
        { id: 'spend', unit: 'gbp', agg: 'sum', base: 690, seed: 24 },
        { id: 'orders', unit: 'int', agg: 'sum', base: 44, seed: 23 },
        { id: 'roas', unit: 'x', agg: 'mean', base: 4.1, seed: 25 },
      ],
      tiles: [
        { id: 'k-spend', title: 'Ad spend', kind: 'kpi', series: 'spend', span: 1 },
        { id: 'k-orders', title: 'Orders', kind: 'kpi', series: 'orders', span: 1 },
        { id: 'c-orders', title: 'Orders by channel', kind: 'bar', series: 'orders', split: true, span: 2 },
        { id: 'c-spend', title: 'Spend over time', kind: 'line', series: 'spend', span: 2 },
        { id: 'c-roas', title: 'ROAS over time', kind: 'area', series: 'roas', span: 2 },
      ],
      sql: `SELECT channel, report_date,
       SUM(spend) AS spend,
       SUM(orders) AS orders,
       SAFE_DIVIDE(SUM(revenue), SUM(spend)) AS roas
FROM demo.paid_media_daily
WHERE report_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 8 WEEK)
GROUP BY channel, report_date`,
    },
    {
      id: 'products',
      label: 'Product sales',
      prompt: 'Which categories are selling fastest, and what does the sales trend look like?',
      dimension: 'category',
      categories: ['Outerwear', 'Footwear', 'Basics', 'Accessories', 'Gifts'],
      series: [
        { id: 'units', unit: 'int', agg: 'sum', base: 222, seed: 34 },
        { id: 'price', unit: 'gbp', agg: 'mean', base: 23, seed: 35 },
        { id: 'sell', unit: 'pct', agg: 'mean', base: 61, seed: 32 },
      ],
      tiles: [
        { id: 'k-units', title: 'Units sold', kind: 'kpi', series: 'units', span: 1 },
        { id: 'k-price', title: 'Avg selling price', kind: 'kpi', series: 'price', span: 1 },
        { id: 'c-category', title: 'Units by category', kind: 'bar', series: 'units', split: true, span: 2 },
        { id: 'c-units', title: 'Units over time', kind: 'area', series: 'units', span: 2 },
        { id: 'c-sell', title: 'Sell-through rate', kind: 'line', series: 'sell', span: 2 },
      ],
      sql: `SELECT category, sale_date,
       SUM(units) AS units,
       SAFE_DIVIDE(SUM(revenue), SUM(units)) AS avg_selling_price,
       SAFE_DIVIDE(SUM(units), SUM(units_received)) AS sell_through
FROM demo.product_sales_daily
WHERE sale_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 8 WEEK)
GROUP BY category, sale_date`,
    },
  ] satisfies AskPreset[],
};
