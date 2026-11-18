import type { CaseStudy } from '../types.ts';

export const aiDashboardGenerator: CaseStudy = {
  slug: 'ai-dashboard-generator',
  no: '06',
  title: 'AI Dashboard Generator',
  short: 'AI Dashboard Generator',
  kind: 'built',
  kindLabel: 'Built by me',
  kicker: 'Dashboards from a sentence in about 30 seconds',
  summary: 'Describe the dashboard you need in plain English. Get an interactive one back in about 30 seconds.',
  when: 'Project',
  facts: {
    role: 'Design and build',
    type: 'AI-powered dashboard generation platform',
    period: 'Project',
    stack: ['Google BigQuery', 'Vertex AI', 'Prompt engineering', 'LLM APIs'],
  },
  theme: 'ink',
  tint: '#B79CFF',
  signal: { layout: 'caret', color: '#B79CFF', turbulence: 0.05, flow: 0.3, spread: 0.2, x: -0.55, intensity: 1 },
  signalCaption: '// the thread waits as a cursor, then becomes charts',
  seo: {
    title: 'AI dashboard generator, BigQuery + Vertex AI | Het Suhagiya, Data Analyst, London',
    description:
      'An AI-powered dashboard generation platform built on Google BigQuery and Vertex AI: interactive dashboards from natural-language requirements in about 30 seconds, with independently editable charts.',
  },
  brief: {
    body: 'An AI-powered dashboard generation platform built on Google BigQuery and Vertex AI. It turns natural-language requirements into interactive dashboards in about 30 seconds, through a prompt-driven workflow with KPI visualisation and independent editing of chart components.',
    caption: '// requirement in, dashboard out',
    glyph: 'prompt',
  },
  challenge: {
    heading: 'The slowest part of a dashboard is the conversation before it.',
    body: 'Requirements arrive as sentences. Dashboards are built from queries, metrics and chart specs. The translation between the two is where the waiting happens.',
    caption: '// drag the pieces: a requirement, in fragments',
    mess: {
      fragments: [
        '"can we see revenue…"',
        '"…by channel?"',
        '"weekly, not daily"',
        '"add conversion rate"',
        '"last quarter only"',
        'which table?',
        'which metric?',
        'which chart?',
        'v1',
        'v2',
        'v3',
      ],
      resolved: ['One sentence', 'One generated dashboard', 'Edit any chart on its own'],
      chaosLabel: '// requirements, scattered across messages',
      orderLabel: '// one prompt, one dashboard',
    },
  },
  approach: {
    heading: 'Ask your data',
    intro: 'Pick a prompt and press Enter. This is a scripted replay of the workflow on synthetic data: no model is called from this page.',
    module: 'ask-your-data',
    moduleTitle: 'Ask your data',
    alt: 'A scripted demo of the prompt-to-dashboard workflow on synthetic data. Choose one of three preset prompts and run it. A pipeline diagram lights up in order (natural language, Vertex AI, generated BigQuery SQL, chart specs, rendered dashboard) while tiles appear and a time-lapse counter runs to about 30 seconds. The finished dashboard is editable: tiles can be reordered and resized, chart types switched, and a single tile changed with a follow-up prompt.',
    caption: '// scripted replay, time-lapse, synthetic data',
    chapters: [
      { title: 'Ask', body: 'A requirement in plain English. No field names, no chart types.' },
      { title: 'Generate', body: 'Vertex AI turns the requirement into BigQuery SQL and a spec for each chart.' },
      { title: 'Render', body: 'Tiles materialise as queries return. About 30 seconds, shown here as a time-lapse.' },
      { title: 'Edit', body: 'Each chart is its own component. Move it, resize it, retype it or re-prompt it.' },
    ],
  },
  build: {
    heading: 'Natural language in, SQL and chart specs out',
    body: 'The model never draws a chart. It writes a query and a spec for each tile, BigQuery returns the rows, and the front end renders them. That separation is what makes each tile editable on its own.',
    diagram: {
      caption: '// natural language → Vertex AI → BigQuery SQL → chart specs → dashboard',
      nodes: [
        { id: 'nl', label: 'Natural language', sub: 'the requirement', col: 0, row: 0 },
        { id: 'vertex', label: 'Vertex AI', sub: 'interprets + plans', col: 1, row: 0 },
        { id: 'sql', label: 'BigQuery SQL', sub: 'generated', col: 2, row: 0 },
        { id: 'spec', label: 'Chart specs', sub: 'one per tile', col: 3, row: 0 },
        { id: 'dash', label: 'Dashboard', sub: 'rendered, editable', col: 4, row: 0, decision: true },
      ],
      edges: [
        ['nl', 'vertex'],
        ['vertex', 'sql'],
        ['sql', 'spec'],
        ['spec', 'dash'],
      ],
    },
    snippet: {
      lang: 'python',
      title: 'build_dashboard.py',
      caption: '// illustrative snippet, simplified',
      code: `# The prompt-to-dashboard loop, simplified
def build_dashboard(requirement: str, schema: dict) -> Dashboard:
    plan = model.generate(                      # Vertex AI
        prompt=PLAN_PROMPT.format(
            requirement=requirement, schema=schema),
        response_schema=DashboardPlan,
    )
    tiles = []
    for chart in plan.charts:
        rows = bigquery.query(chart.sql).result()
        tiles.append(Tile(spec=chart.spec, rows=rows))
    return Dashboard(tiles=tiles)`,
      notes: [
        { line: 3, text: 'The model plans from the requirement and the table schema.' },
        { line: 6, text: 'Structured output: a plan the app can validate.' },
        { line: 10, text: 'Each tile owns its own query.' },
        { line: 11, text: 'So each tile can be edited without touching the rest.' },
      ],
    },
  },
  outcome: {
    heading: 'A dashboard in the time it takes to describe one',
    body: 'Interactive dashboards generated from natural-language requirements, with KPI visualisation and independent editing of every chart component.',
    stats: [{ value: 30, prefix: '~', suffix: 's', label: 'from requirement to interactive dashboard' }],
  },
  learned: {
    body: 'The hard part was not generation, it was making the result editable afterwards. Next I would add evaluation: a fixed set of prompts that the platform must keep answering correctly.',
  },
  extras: {
    howItWorks: {
      heading: 'How it works, honestly',
      steps: [
        { title: 'You write a requirement', body: 'Plain English. The prompt-driven workflow starts and ends with what you ask for.' },
        { title: 'Vertex AI plans the dashboard', body: 'The requirement becomes queries and KPI visualisations.' },
        { title: 'BigQuery answers', body: 'The generated SQL runs against the data in Google BigQuery.' },
        { title: 'You keep editing', body: 'Every chart component can be changed independently of the others.' },
      ],
    },
    decisions: {
      heading: 'Design decisions',
      items: [
        'Each chart is an independent component, so one edit never rebuilds the whole dashboard.',
        'The workflow is prompt-driven from start to finish: the same input that creates a dashboard also changes it.',
        'KPIs are first-class tiles, not an afterthought beneath the charts.',
      ],
    },
  },
};
