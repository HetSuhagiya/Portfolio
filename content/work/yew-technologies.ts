import type { CaseStudy } from '../types.ts';

export const yewTechnologies: CaseStudy = {
  slug: 'yew-technologies',
  no: '05',
  title: 'Yew Technologies',
  short: 'Yew Technologies',
  kind: 'internship',
  kindLabel: 'Internship',
  kicker: '10,000+ retail transactions',
  summary: 'Where it started: retail sales analysed in SQL, then turned into Tableau dashboards for sales and inventory.',
  when: '6 months',
  facts: {
    role: 'Data Analyst Intern',
    type: 'Internship',
    period: '6 months [EDIT: dates]',
    stack: ['SQL', 'Tableau'],
  },
  theme: 'ink',
  tint: '#B6F09C',
  signal: { layout: 'dots', color: '#B6F09C', turbulence: 0.06, flow: 0.2, spread: 0.25, intensity: 0.8 },
  signalCaption: '// every particle is one sale',
  seo: {
    title: 'Yew Technologies retail analysis, 10,000+ transactions | Het Suhagiya, Data Analyst, London',
    description:
      'A six-month data internship at Yew Technologies: 10,000+ retail transactions analysed in SQL for sales trends, product performance and inventory planning, with Tableau dashboards.',
  },
  brief: {
    body: 'A six-month internship as a Data Analyst at Yew Technologies. I analysed 10,000+ retail transactions in SQL to find sales trends, product performance and inventory-planning signals, then built Tableau dashboards for sales and inventory KPIs.',
    caption: '// 10,000+ rows, three questions',
    glyph: 'dots',
  },
  challenge: {
    heading: 'Ten thousand rows do not answer a question.',
    body: 'A transaction table records everything and explains nothing. What is selling, what is slowing and what is about to run out are all in there, but only once the rows are grouped the right way.',
    caption: '// drag the pieces: raw rows, no shape',
    mess: {
      fragments: [
        'txn 00417 · £18.50',
        'txn 03992 · £6.20',
        'txn 08110 · £42.00',
        'txn 01265 · £9.99',
        'txn 09731 · £27.40',
        'txn 05508 · £3.75',
        'txn 07044 · £61.10',
        'txn 02876 · £14.00',
        'txn 06613 · £8.30',
        'txn 04159 · £33.25',
      ],
      resolved: ['Sales trends', 'Product performance', 'Inventory planning'],
      chaosLabel: '// rows',
      orderLabel: '// answers',
    },
  },
  approach: {
    heading: '10,000 sales',
    intro: 'Every dot is one synthetic transaction. Regroup them and the questions answer themselves.',
    module: 'ten-thousand-sales',
    moduleTitle: '10,000 sales',
    alt: 'A dot matrix of 10,000 points, each one a synthetic retail transaction. The dots can be regrouped by product category and by month, and filtered. A KPI strip shows total sales, top products and products at risk of running out of stock for the current selection.',
    caption: '// scale you can feel: one dot, one sale',
    chapters: [
      { title: 'All of it', body: '10,000 transactions, one dot each. This is what the table looks like.' },
      { title: 'Product performance', body: 'Group by category and the best and worst sellers separate.' },
      { title: 'Sales trends', body: 'Group by month and the trend appears as shape.' },
      { title: 'Inventory planning', body: 'Filter freely. The KPI strip flags what sells fastest against stock.' },
    ],
  },
  build: {
    heading: 'SQL first, dashboards second',
    body: 'The analysis ran in SQL: aggregating transactions into trends, product rankings and stock signals. The Tableau dashboards then tracked the sales and inventory KPIs those queries defined.',
    diagram: {
      caption: '// transactions → questions → KPIs',
      nodes: [
        { id: 'txn', label: 'Transactions', sub: '10,000+ rows', col: 0, row: 1 },
        { id: 'trend', label: 'Sales trends', sub: 'SQL', col: 1, row: 0 },
        { id: 'prod', label: 'Product performance', sub: 'SQL', col: 1, row: 1 },
        { id: 'inv', label: 'Inventory planning', sub: 'SQL', col: 1, row: 2 },
        { id: 'dash', label: 'Tableau dashboards', sub: 'sales + inventory KPIs', col: 2, row: 1, decision: true },
      ],
      edges: [
        ['txn', 'trend'],
        ['txn', 'prod'],
        ['txn', 'inv'],
        ['trend', 'dash'],
        ['prod', 'dash'],
        ['inv', 'dash'],
      ],
    },
    snippet: {
      lang: 'sql',
      title: 'stock_cover.sql',
      caption: '// illustrative snippet, generic names, no company data',
      code: `-- Which products sell fastest relative to the stock on hand?
SELECT
  product_id,
  category,
  SUM(quantity)                AS units_sold,
  SUM(quantity * unit_price)   AS sales,
  MAX(stock_on_hand)
    / NULLIF(SUM(quantity) / 4.0, 0) AS weeks_of_cover
FROM retail.transactions
WHERE sold_at >= CURRENT_DATE - INTERVAL '28' DAY
GROUP BY product_id, category
ORDER BY weeks_of_cover ASC;`,
      notes: [
        { line: 5, text: 'Product performance: units and value.' },
        { line: 8, text: 'Inventory planning: stock divided by weekly sales rate.' },
        { line: 12, text: 'Lowest cover first: the reorder list writes itself.' },
      ],
    },
  },
  outcome: {
    heading: 'From rows to a reorder list',
    body: 'Sales trends, product performance and inventory planning, analysed in SQL and tracked in Tableau dashboards for sales and inventory KPIs.',
    stats: [
      { value: 10000, suffix: '+', label: 'retail transactions analysed in SQL' },
      { value: 6, label: 'months as Data Analyst Intern' },
    ],
  },
  learned: {
    body: '[EDIT: draft] This is where I learned that a good grouping beats a clever chart. Next I would add seasonality to the stock signal, so cover is judged against the weeks ahead and not the weeks behind.',
  },
};
