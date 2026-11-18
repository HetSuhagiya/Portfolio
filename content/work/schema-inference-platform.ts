import type { CaseStudy } from '../types.ts';

export const schemaInferencePlatform: CaseStudy = {
  slug: 'schema-inference-platform',
  no: '07',
  title: 'Schema Inference Platform',
  short: 'Schema Inference Platform',
  kind: 'built',
  kindLabel: 'Built by me',
  kicker: 'From messy files to BigQuery-ready schemas',
  summary: 'Automated ETL for CSV and Excel: infer the schema, standardise the types, check the quality, emit a schema BigQuery accepts.',
  when: 'Project',
  facts: {
    role: 'Design and build',
    type: 'Data processing and schema inference platform',
    period: 'Project',
    stack: ['ETL', 'Schema inference', 'Data quality checks', 'BigQuery'],
  },
  theme: 'ink',
  tint: '#7CC8FF',
  signal: { layout: 'combed', color: '#7CC8FF', turbulence: 0.1, flow: 0.25, spread: 0.3, param: 0.85, intensity: 0.85 },
  signalCaption: '// tangled threads, combed into parallel lines',
  seo: {
    title: 'Schema inference platform, messy files to BigQuery | Het Suhagiya, Data Analyst, London',
    description:
      'A data processing and schema inference platform: automated ETL for CSV and Excel with type standardisation and data-quality checks, producing BigQuery-compatible schemas.',
  },
  brief: {
    body: 'A data processing and schema inference platform: automated ETL for CSV and Excel files. It infers the schema, standardises data types, runs data-quality checks for inconsistent formats, missing values and mixed types, and outputs BigQuery-compatible schemas.',
    caption: '// messy file in, clean schema out',
    glyph: 'table',
  },
  challenge: {
    heading: 'Every spreadsheet is a schema nobody wrote down.',
    body: 'Real files mix date formats, hide numbers inside text and leave gaps. A warehouse needs one type per column. Somebody, or something, has to decide what each column really is.',
    caption: '// drag the pieces: one column, six formats',
    mess: {
      fragments: [
        '2024-03-01',
        '01/03/2024',
        '3 Mar 24',
        '"1,200.50"',
        '£45',
        '(blank)',
        'N/A',
        'TRUE',
        'yes',
        '12.5',
        'twelve',
      ],
      resolved: ['DATE', 'NUMERIC', 'BOOL', 'NULLABLE where blank'],
      chaosLabel: '// formats, as they arrive',
      orderLabel: '// types, as BigQuery needs them',
    },
  },
  approach: {
    heading: 'Clean the file',
    intro: 'A messy synthetic CSV is loaded below. Step through the pipeline and watch each cell get resolved. The inference here really runs in your browser, on a simplified version of the logic.',
    module: 'clean-the-file',
    moduleTitle: 'Clean the file',
    alt: 'A synthetic messy CSV shown as a table with mixed date formats, blank cells and numbers stored as text. Four steps run in order: detect types, standardise, validate and emit schema. Flagged cells turn from red to green, a data-quality score counts up, and a BigQuery-compatible schema is written out as JSON. Each column can be toggled between its before and after state.',
    caption: '// detect types → standardise → validate → emit schema',
    chapters: [
      { title: 'Detect types', body: 'Read every value in a column and infer what it is trying to be.' },
      { title: 'Standardise', body: 'Rewrite each value into one format per type: one date format, real numbers, real booleans.' },
      { title: 'Validate', body: 'Check for missing values and mixed types. Score the quality of the file.' },
      { title: 'Emit schema', body: 'Write a BigQuery-compatible schema: name, type and mode for every column.' },
    ],
  },
  build: {
    heading: 'An ETL pipeline that explains its own decisions',
    body: 'Files go in as CSV or Excel. Each stage narrows the uncertainty: infer, standardise, check. What comes out is a clean table and the schema that describes it.',
    diagram: {
      caption: '// CSV / Excel → infer → standardise → check → BigQuery schema',
      nodes: [
        { id: 'csv', label: 'CSV', col: 0, row: 0 },
        { id: 'xlsx', label: 'Excel', col: 0, row: 1 },
        { id: 'infer', label: 'Schema inference', sub: 'detect types', col: 1, row: 0.5 },
        { id: 'std', label: 'Standardise', sub: 'one format per type', col: 2, row: 0.5 },
        { id: 'dq', label: 'Quality checks', sub: 'formats, blanks, mixed', col: 3, row: 0.5 },
        { id: 'bq', label: 'BigQuery schema', sub: 'ready to load', col: 4, row: 0.5, decision: true },
      ],
      edges: [
        ['csv', 'infer'],
        ['xlsx', 'infer'],
        ['infer', 'std'],
        ['std', 'dq'],
        ['dq', 'bq'],
      ],
    },
    snippet: {
      lang: 'python',
      title: 'infer_type.py',
      caption: '// illustrative snippet, simplified',
      code: `# Infer one column's type from the values it actually holds
def infer_type(values: list[str]) -> str:
    present = [v.strip() for v in values if v and v.strip()]
    if not present:
        return "STRING"
    for bq_type, parses in CASTERS:   # INT64, FLOAT64, BOOL, DATE
        if all(parses(v) for v in present):
            return bq_type
    return "STRING"                   # mixed types fall back safely`,
      notes: [
        { line: 3, text: 'Missing values are set aside, not guessed.' },
        { line: 6, text: 'Strictest type first, most permissive last.' },
        { line: 9, text: 'When values disagree, the column stays loadable.' },
      ],
    },
  },
  outcome: {
    heading: 'Files a warehouse will accept',
    body: 'Automated ETL for CSV and Excel with schema inference, data-type standardisation and data-quality checks, producing BigQuery-compatible schemas.',
    stats: [],
  },
  learned: {
    body: 'Inference is the easy half; reporting why a column got its type is what makes people trust it. Next I would add a review step where a person can override any inferred type.',
  },
};
