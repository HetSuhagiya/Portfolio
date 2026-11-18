/** Copy for /about. Facts only. [EDIT] marks drafts for Het to confirm. */

export type Skill = {
  name: string;
  /** What it was used for. CV facts only; unverified ties are marked [EDIT]. */
  usedFor: string;
};

export type SkillGroup = { id: string; label: string; skills: Skill[] };

export const about = {
  hero: {
    eyebrow: '// about',
    heading: 'The full story',
    subline: 'A Data Analyst in London, trained in data science, shaped by client delivery.',
    caption: '// origin → training → practice → now',
  },
  origin: {
    eyebrow: '// origin',
    heading: 'Why data',
    body: 'I have always wanted to know why a number is what it is. A sales figure, a conversion rate, a chart that suddenly dips: there is a reason behind each one, and most of the time it is hiding in data that nobody has had the time to untangle. That curiosity took me to an MSc in Data Science and Analytics at Brunel, and then into client work, where I learned that an answer only matters if people trust it enough to act on it. Today I connect sources, own the logic and build the dashboards that carry a number from raw data to a decision.',
    caption: '// noise first, then a question',
  },
  timeline: {
    eyebrow: '// timeline',
    heading: 'So far',
    caption: '// scroll to move through time',
    items: [
      {
        id: 'msc',
        when: 'Sept 2023 to Dec 2024',
        title: 'MSc Data Science and Analytics',
        place: 'Brunel University of London',
        body: 'Coursework in Quantitative Data Analysis, Distributed Data Analysis, Data Visualisation and Machine Learning.',
        tags: ['Quantitative Data Analysis', 'Distributed Data Analysis', 'Data Visualisation', 'Machine Learning'],
        layout: 'noise',
        meaning: '// learning to read the noise',
      },
      {
        id: 'yew',
        when: '6 months',
        title: 'Data Analyst Intern',
        place: 'Yew Technologies',
        body: 'Analysed 10,000+ retail transactions in SQL for sales trends, product performance and inventory planning. Built Tableau dashboards for sales and inventory KPIs.',
        tags: ['SQL', 'Tableau', '10,000+ transactions'],
        layout: 'dots',
        meaning: '// first real rows: every dot a sale',
      },
      {
        id: 'dashworx',
        when: 'Sept 2025 to Nov 2026',
        title: 'Data Analyst',
        place: 'Dashworx, London',
        body: 'End-to-end analytics delivery across 10+ client accounts including Publicis Groupe, Pantherella International Group and Christopher Ward: data solutions, KPI frameworks and BI dashboards.',
        tags: ['BigQuery', 'Funnel.io', 'Tableau', 'Looker Studio', '10+ accounts'],
        layout: 'pipeline',
        meaning: '// the full pipeline: connect, own, act',
      },
      {
        id: 'now',
        when: 'Now',
        title: 'Open to new roles',
        place: 'London, UK',
        body: 'Looking for my next role as a Data Analyst, Analytics Engineer or BI Developer, including AI and analytics hybrid roles.',
        tags: ['Data Analyst', 'Analytics Engineer', 'BI Developer'],
        layout: 'point',
        meaning: '// the next decision',
      },
    ],
  },
  howIWork: {
    eyebrow: '// how I work',
    heading: 'Connect, Own, Act',
    caption: '// the same three movements on every account',
    items: [
      {
        no: '01',
        title: 'Connect',
        principle: 'Integrate and validate every source before trusting any of them.',
      },
      {
        no: '02',
        title: 'Own',
        principle: 'Calculate each metric once, in SQL, where it can be checked.',
      },
      {
        no: '03',
        title: 'Act',
        principle: 'A dashboard is finished when someone can make a decision from it.',
      },
    ],
  },
  toolkit: {
    eyebrow: '// toolkit',
    heading: 'The constellation',
    body: 'Every tool is a node. Hover, focus or tap one to see what I used it for.',
    caption: '// grouped by what each tool does to the signal',
    listToggle: { list: 'View as list', map: 'View as constellation' },
    groups: [
      {
        id: 'programming',
        label: 'Programming',
        skills: [
          {
            name: 'SQL',
            usedFor: 'SQL views in BigQuery at Dashworx; analysis of 10,000+ retail transactions at Yew Technologies.',
          },
          { name: 'Python', usedFor: 'Core analysis language.' },
          { name: 'Excel', usedFor: 'Excel files are one of the two inputs to my schema inference platform.' },
          {
            name: 'Statistical Analysis',
            usedFor: 'MSc coursework in Quantitative Data Analysis at Brunel University of London.',
          },
        ],
      },
      {
        id: 'bi',
        label: 'BI',
        skills: [
          {
            name: 'Looker Studio',
            usedFor: 'Dashboards for commercial performance, trends and actionable insight at Dashworx.',
          },
          {
            name: 'Tableau',
            usedFor: 'Led a Tableau reporting project for Publicis Groupe; sales and inventory dashboards at Yew Technologies.',
          },
          { name: 'Power BI', usedFor: 'Part of my BI toolkit.' },
        ],
      },
      {
        id: 'engineering',
        label: 'Data Engineering',
        skills: [
          {
            name: 'BigQuery',
            usedFor: 'SQL views for transformations, business logic and consistent metric calculations at Dashworx; the target of both of my own projects.',
          },
          { name: 'PostgreSQL', usedFor: 'Part of my database toolkit.' },
          { name: 'ETL', usedFor: 'Automated ETL for CSV and Excel in my schema inference platform.' },
          { name: 'Data Modelling', usedFor: 'KPI frameworks and metric logic across 10+ client accounts.' },
          { name: 'Data Pipelines', usedFor: 'Sources to Funnel.io to BigQuery to BI, for every Dashworx account.' },
          {
            name: 'Funnel.io',
            usedFor: 'Integrated and validated 10+ data sources per client: GA4, Google Ads, Meta Ads, Shopify.',
          },
        ],
      },
      {
        id: 'cloud',
        label: 'Cloud',
        skills: [
          { name: 'GCP', usedFor: 'BigQuery and Vertex AI, in client work and in my own projects.' },
          { name: 'Git', usedFor: 'Version control.' },
          { name: 'Docker', usedFor: 'Containers.' },
        ],
      },
      {
        id: 'ai',
        label: 'AI & LLMs',
        skills: [
          { name: 'Vertex AI', usedFor: 'The model layer of my AI dashboard generation platform.' },
          {
            name: 'Conversational Analytics',
            usedFor: 'Dashboards generated from natural-language requirements.',
          },
          { name: 'LLM APIs', usedFor: 'Vertex AI, called from my AI dashboard generation platform.' },
          { name: 'Prompt Engineering', usedFor: 'The prompt-driven workflow behind dashboards in about 30 seconds.' },
          { name: 'RAG', usedFor: 'Retrieval-augmented generation.' },
        ],
      },
    ] satisfies SkillGroup[],
  },
} as const;
