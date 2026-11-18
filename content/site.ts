/**
 * Global site facts. Source of truth: Het's CV.
 * Anything marked [EDIT] must be confirmed or replaced before launch.
 */

export const site = {
  name: 'Het Suhagiya',
  role: 'Data Analyst',
  location: 'London, UK',
  /** [EDIT: domain] Used for canonical URLs, the sitemap and Open Graph images. */
  url: 'https://hetsuhagiya.com',
  email: 'hetsuhagiya1409@outlook.com',
  linkedin: 'https://www.linkedin.com/in/hetsuhagiya',
  company: { name: 'Dashworx', url: 'https://www.dashworx.com' },
  /** [EDIT: GitHub URL or hide] Set to a URL string to show the link everywhere, or keep null to hide it. */
  github: null as string | null,
  cv: { href: '/Het_CV.pdf', filename: 'Het_CV.pdf' },
  status: 'Open to new roles',
  tagline: 'Data Analyst. I turn messy data into decisions people trust.',
  summary:
    'Data Analyst skilled in SQL, Python, BigQuery and business intelligence, delivering analytics across 10+ client accounts. Data modelling, KPI development, reporting automation and data validation, turning business requirements into insight through interactive dashboards and operational reporting.',
  targetRoles: ['Data Analyst', 'Analytics Engineer', 'BI Developer', 'AI / analytics hybrid roles'],
  /**
   * Show the small [EDIT] badges next to draft copy on the live site.
   * Keep true while reviewing; set to false once every placeholder is resolved.
   */
  showEditMarkers: false,
  demoLabel: 'Illustrative demo, synthetic data, not client data',
} as const;

export const nav = [
  { no: '01', label: 'Home', href: '/' },
  { no: '02', label: 'About', href: '/about' },
  { no: '03', label: 'Work', href: '/work' },
  { no: '04', label: 'Résumé', href: '/resume' },
  { no: '05', label: 'Contact', href: '/contact' },
] as const;

/** Where the giant "Next" footer link points on each non-case-study page. */
export const nextUp: Record<string, { href: string; label: string; eyebrow: string }> = {
  '/': { href: '/work', label: 'All work', eyebrow: 'Next' },
  '/about': { href: '/work', label: 'The work', eyebrow: 'Next' },
  '/work': { href: '/about', label: 'The story', eyebrow: 'Next' },
  '/resume': { href: '/contact', label: 'Get in touch', eyebrow: 'Next' },
  '/contact': { href: '/work', label: 'The work', eyebrow: 'Meanwhile' },
};

export const pageSeo = {
  home: {
    title: 'Het Suhagiya | Data Analyst, London',
    description:
      'Het Suhagiya is a London-based Data Analyst working in SQL, BigQuery, Tableau and Looker Studio across 10+ client accounts. From signal to decision.',
  },
  about: {
    title: 'About | Het Suhagiya, Data Analyst, London',
    description:
      'The story so far: MSc Data Science and Analytics at Brunel University of London, a data internship at Yew Technologies, and analytics delivery across 10+ client accounts at Dashworx.',
  },
  work: {
    title: 'Work | Het Suhagiya, Data Analyst, London',
    description:
      'Client work and self-built projects: Tableau delivery, KPI frameworks, reporting automation, BigQuery data platforms, an AI dashboard generator and a schema inference platform.',
  },
  resume: {
    title: 'Résumé | Het Suhagiya, Data Analyst, London',
    description:
      'Résumé of Het Suhagiya: Data Analyst with SQL, Python, BigQuery, Tableau, Looker Studio and Funnel.io experience across 10+ client accounts. Download the CV.',
  },
  contact: {
    title: 'Contact | Het Suhagiya, Data Analyst, London',
    description:
      'Het Suhagiya is open to new roles as a Data Analyst, Analytics Engineer or BI Developer. Get in touch by email or LinkedIn, or download the CV.',
  },
  notFound: {
    title: 'Signal lost | Het Suhagiya',
    description: 'This page could not be found. The signal reconnects from here.',
  },
} as const;
