/** Résumé page transcribed from public/Het_CV.pdf. Update this content when replacing that PDF. */
export const resume = {
  heading: 'Résumé',
  eyebrow: '// the recruiter fast lane',
  printHint: 'Print-friendly: this page prints on clean paper without the site chrome.',
  mobile: '+44 7940 039993',
  mobileHref: 'tel:+447940039993',
  summary:
    'Data Analyst experienced in SQL, Python, BigQuery and business intelligence, delivering analytics solutions across 10+ client accounts. Skilled in data modelling, KPI development, reporting automation and data validation to ensure accurate management information. Experienced in translating business requirements into actionable insights through interactive dashboards and operational reporting.',
  experience: [
    {
      role: 'Data Analyst',
      org: 'Dashworx',
      when: 'Sept 2025 - Nov 2026',
      bullets: [
        'Managed end-to-end analytics delivery across 10+ client accounts, including Publicis Groupe, Pantherella International Group and Christopher Ward, developing data solutions, KPI frameworks and BI dashboards to support business decisions',
        'Led the end-to-end delivery of a Tableau reporting project for Publicis Groupe, taking responsibility for dashboard development, data integration, reporting logic and KPI implementation',
        'Developed and maintained SQL views in Google BigQuery, implementing data transformations, business logic and consistent metric calculations to deliver accurate management information',
        'Integrated and validated 10+ data sources per client account using Funnel.io, including GA4, Google Ads, Meta Ads and Shopify, ensuring reliable reporting across marketing and commercial operations',
        'Investigated data anomalies, reconciled discrepancies between source platforms and BI reports, and validated KPI calculations to improve data quality and reporting consistency',
        'Built and maintained Looker Studio dashboards to analyse commercial performance, identify trends and deliver actionable insights for operational decision-making',
      ],
    },
    {
      role: 'Data Analyst Intern',
      org: 'Yew Technologies',
      when: '6 Months',
      bullets: [
        'Analysed 10,000+ retail transactions using SQL, identifying sales trends, product performance patterns and opportunities to improve inventory planning and operational efficiency',
        'Developed Tableau dashboards to monitor sales and inventory KPIs, transforming transactional data into actionable insights for business reporting and decision-making',
      ],
    },
  ],
  projects: [
    {
      name: 'AI-Powered Dashboard Generation Platform',
      href: '/work/ai-dashboard-generator',
      bullets: [
        'Developed an AI-powered business intelligence platform using Google BigQuery and Vertex AI, generating interactive analytical dashboards from natural-language requirements in approximately 30 seconds',
        'Implemented a prompt-driven reporting workflow supporting KPI visualisation, dashboard generation and independent editing of chart components to improve analytical self-service',
      ],
    },
    {
      name: 'Data Processing & Schema Inference Platform',
      href: '/work/schema-inference-platform',
      bullets: [
        'Developed an automated ETL and data-processing pipeline for CSV and Excel datasets, implementing schema inference, data-type standardisation and transformations to reduce manual data preparation',
        'Implemented data-quality checks and validation workflows to handle inconsistent formats, missing values and mixed data types, producing structured datasets and BigQuery-compatible schemas for reliable ingestion',
      ],
    },
  ],
  education: [
    {
      degree: 'MSc in Data Science and Analytics',
      school: 'Brunel University of London',
      when: 'Sept 2023 – Dec 2024',
      detail:
        'Coursework: Quantitative Data Analysis, Distributed Data Analysis, Data Visualisation, Machine Learning',
    },
  ],
  skills: [
    { label: 'Programming', items: ['SQL', 'Python', 'Excel', 'Statistical Analysis'] },
    { label: 'BI & Reporting', items: ['Looker Studio', 'Tableau', 'Power BI'] },
    {
      label: 'Data Engineering',
      items: ['BigQuery', 'PostgreSQL', 'ETL', 'Data Modelling', 'Data Pipelines', 'Funnel.io'],
    },
    { label: 'Cloud & Development', items: ['Google Cloud Platform (GCP)', 'Git', 'Docker'] },
    {
      label: 'AI & LLMs',
      items: ['Vertex AI', 'Conversational Analytics', 'LLM APIs', 'Prompt Engineering', 'RAG'],
    },
  ],
} as const;

export const contact = {
  eyebrow: '// destination',
  heading: 'Let’s talk',
  body: 'I am looking for my next role as a Data Analyst, Analytics Engineer or BI Developer, including AI and analytics hybrid roles. Email is the fastest way to reach me.',
  caption: '// the thread converges: one point, one conversation',
  copyLabel: 'Copy email',
  copiedLabel: 'Copied to clipboard',
  links: {
    email: 'Email',
    linkedin: 'LinkedIn',
    company: 'Dashworx',
    github: 'GitHub',
    cv: 'Download CV',
  },
} as const;

export const notFound = {
  code: '404',
  heading: 'Signal lost',
  body: 'This page does not exist, or it moved. The thread reconnects from here.',
  caption: '// a break in the line, closing',
  links: [
    { label: 'Back to the start', href: '/' },
    { label: 'See the work', href: '/work' },
  ],
} as const;
