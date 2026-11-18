/** Deliberately small, strict inference engine. No uploads, network or arbitrary code execution. */
export type DataType = 'INTEGER' | 'FLOAT' | 'BOOLEAN' | 'DATE' | 'STRING';
export type CellValue = string | number | boolean | null;
export type Cell = {
  before: string;
  after: CellValue;
  status: 'unchanged' | 'standardised' | 'missing' | 'review';
  reason: string;
};
export type Column = {
  name: string;
  type: DataType;
  mode: 'NULLABLE' | 'REQUIRED';
  cells: Cell[];
  explanation: string;
};
export type InputTable = { headers: string[]; rows: string[][] };
export const sample: InputTable = {
  headers: ['order_date', 'amount', 'is_paid', 'customer'],
  rows: [
    ['2026-03-01', '1,200.50', 'TRUE', 'Ada'],
    ['02/03/2026', '£45', 'yes', 'Ben'],
    ['3 Mar 2026', '12.5', 'false', 'Cara'],
    ['', 'N/A', 'no', 'Dev'],
    ['2026-03-05', '80', 'true', 'Eli'],
    ['06/03/2026', '£210.00', 'YES', 'Fran'],
  ],
};
const missing = (v: string) => /^(?:n\/a|null)?$/i.test(v.trim());
function numeric(v: string): number | undefined {
  const s = v.trim().replace(/^£\s*/, '');
  if (!/^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(s)) return;
  const n = Number(s.replaceAll(',', ''));
  if (!Number.isFinite(n) || Math.abs(n) > Number.MAX_SAFE_INTEGER) return;
  // Preserve codes such as 00123 rather than silently removing leading zeroes.
  if (/^[+-]?0\d/.test(s)) return;
  return n;
}
function boolean(v: string): boolean | undefined {
  if (/^(true|yes)$/i.test(v.trim())) return true;
  if (/^(false|no)$/i.test(v.trim())) return false;
}
const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
export function parseDate(value: string): string | undefined {
  const v = value.trim();
  let y: number, m: number, d: number;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  const uk = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v);
  const named = /^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/.exec(v);
  if (iso) {
    y = Number(iso[1]);
    m = Number(iso[2]);
    d = Number(iso[3]);
  } else if (uk) {
    y = Number(uk[3]);
    m = Number(uk[2]);
    d = Number(uk[1]);
  } else if (named) {
    y = Number(named[3]);
    m = monthNames.indexOf(named[2]!.toLowerCase()) + 1;
    d = Number(named[1]);
  } else return;
  if (y < 1000 || y > 9999 || m < 1 || m > 12 || d < 1) return;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function parse(v: string, type: DataType): CellValue | undefined {
  if (type === 'DATE') return parseDate(v);
  if (type === 'BOOLEAN') return boolean(v);
  if (type === 'FLOAT' || type === 'INTEGER') {
    const n = numeric(v);
    return n !== undefined && (type !== 'INTEGER' || Number.isInteger(n)) ? n : undefined;
  }
  return v.trim();
}
export function inferTable(input: InputTable) {
  const columns: Column[] = input.headers.map((name, index) => {
    const values = input.rows.map((row) => row[index] ?? '');
    const present = values.filter((v) => !missing(v));
    const candidates: DataType[] = ['INTEGER', 'FLOAT', 'BOOLEAN', 'DATE'];
    const type =
      candidates.find((t) => present.length > 0 && present.every((v) => parse(v, t) !== undefined)) ??
      'STRING';
    const mixed = type === 'STRING' && present.some((v) => candidates.some((t) => parse(v, t) !== undefined));
    const cells: Cell[] = values.map((before) => {
      if (missing(before))
        return {
          before,
          after: null,
          status: 'missing',
          reason: 'Missing value retained as null; not guessed.',
        };
      const after = parse(before, type)!;
      if (mixed)
        return {
          before,
          after,
          status: 'review',
          reason: 'Mixed or ambiguous values: kept as text to avoid data loss.',
        };
      return {
        before,
        after,
        status: String(after) === before ? 'unchanged' : 'standardised',
        reason:
          type === 'DATE' ? 'Dates use day/month/year for slash notation.' : `Value accepted as ${type}.`,
      };
    });
    return {
      name,
      type,
      mode: cells.some((c) => c.after === null) ? 'NULLABLE' : 'REQUIRED',
      cells,
      explanation: !present.length
        ? 'No present values; kept as nullable text.'
        : mixed
          ? 'Values disagree on type. Kept as STRING for review.'
          : `All ${present.length} present values parse as ${type}.`,
    };
  });
  const cells = columns.flatMap((c) => c.cells);
  const unresolved = cells.filter((c) => c.status === 'missing' || c.status === 'review').length;
  const originalIssues = cells.filter((c) => c.status !== 'unchanged').length;
  return {
    columns,
    schema: columns.map(({ name, type, mode }) => ({ name, type, mode })),
    scoreBefore: cells.length ? Math.round(((cells.length - originalIssues) / cells.length) * 100) : 0,
    score: cells.length ? Math.round(((cells.length - unresolved) / cells.length) * 100) : 0,
    unresolved,
    total: cells.length,
  };
}
