import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  marketing,
  marketingTotals,
  groupMarketing,
  revenueModel,
  baseSessions,
  reconcile,
  reconciliationRows,
} from '../components/work/modules/demo-data.ts';
import { sales, retailSummary, months, categories } from '../components/work/modules/retail-data.ts';
import { inferTable, sample, parseDate } from '../components/work/modules/schema-engine.ts';

test('marketing groups conserve totals and compute ratios after aggregation', () => {
  const total = marketingTotals(marketing);
  for (const dimension of ['brand', 'region', 'channel'] as const) {
    const groups = groupMarketing(marketing, dimension);
    assert.equal(
      groups.reduce((s, g) => s + g.conversions, 0),
      total.conversions,
    );
    assert.equal(
      groups.reduce((s, g) => s + g.spend, 0),
      total.spend,
    );
  }
  assert.equal(total.cpa, total.spend / total.conversions);
  assert.equal(marketingTotals([]).cpa, 0);
  assert.ok(marketingTotals(marketing.filter((r) => r.channel === 'Email')).cpa < total.cpa);
});
test('KPI model preserves the revenue equation and handles zero inputs', () => {
  const m = revenueModel(baseSessions, 2.4, [50, 35, 15]);
  assert.equal(m.sessions, 25000);
  assert.equal(m.aov, 54.5);
  assert.equal(m.revenue, 32700);
  assert.equal(
    revenueModel(
      baseSessions.map((n) => n * 2),
      2.4,
      [50, 35, 15],
    ).revenue,
    m.revenue * 2,
  );
  assert.equal(revenueModel([0, 0, 0], 2.4, [50, 35, 15]).revenue, 0);
  assert.equal(revenueModel(baseSessions, 2.4, [0, 0, 0]).revenue, 0);
});
test('exactly 10,000 uniquely identified sales; filters reconcile with the full dataset', () => {
  assert.equal(sales.length, 10000);
  assert.equal(new Set(sales.map((s) => s.id)).size, 10000);
  const total = retailSummary(sales, 6);
  assert.equal(
    months.reduce(
      (sum, m) =>
        sum +
        retailSummary(
          sales.filter((s) => s.month === m),
          1,
        ).total,
      0,
    ),
    total.total,
  );
  assert.equal(
    categories.reduce((sum, c) => sum + sales.filter((s) => s.category === c).length, 0),
    10000,
  );
  assert.equal(
    total.ranked.reduce((sum, p) => sum + p.units, 0),
    sales.reduce((sum, s) => sum + s.quantity, 0),
  );
  assert.ok(total.risk.every((p) => p.cover < 4));
  assert.equal(retailSummary([], 1).total, 0);
});
test('reconciliation removes only the duplicated order', () => {
  assert.deepEqual(reconcile(reconciliationRows), { raw: 690, clean: 480, removed: 1 });
});
test('schema inference transforms the sample and keeps missing values nullable', () => {
  const result = inferTable(sample);
  assert.deepEqual(
    result.schema.map((c) => c.type),
    ['DATE', 'FLOAT', 'BOOLEAN', 'STRING'],
  );
  assert.deepEqual(
    result.schema.map((c) => c.mode),
    ['NULLABLE', 'NULLABLE', 'REQUIRED', 'REQUIRED'],
  );
  assert.equal(result.columns[0]!.cells[1]!.after, '2026-03-02');
  assert.equal(result.columns[1]!.cells[0]!.after, 1200.5);
  assert.equal(result.columns[2]!.cells[1]!.after, true);
  assert.equal(result.columns[1]!.cells[3]!.after, null);
  assert.equal(result.unresolved, 2);
  assert.ok(result.score > result.scoreBefore);
});
test('date parsing rejects impossible dates and uses the stated UK slash convention', () => {
  assert.equal(parseDate('29/02/2024'), '2024-02-29');
  for (const s of ['29/02/2025', '31/04/2026', '00/12/2026', '32/01/2026', '3 Xxx 2026', '2026-13-01'])
    assert.equal(parseDate(s), undefined);
  assert.equal(parseDate('01/03/2026'), '2026-03-01');
});
test('mixed types, leading-zero identifiers and malformed numbers are preserved', () => {
  for (const values of [
    ['12.5', 'twelve'],
    ['00123', '00456'],
    ['1,20.50', '£45'],
    ['9007199254740992', '1'],
  ]) {
    const r = inferTable({ headers: ['value'], rows: values.map((v) => [v]) });
    assert.equal(r.columns[0]!.type, 'STRING');
    assert.deepEqual(
      r.columns[0]!.cells.map((c) => c.after),
      values,
    );
  }
  const empty = inferTable({ headers: ['empty'], rows: [[''], ['N/A']] });
  assert.deepEqual(empty.schema, [{ name: 'empty', type: 'STRING', mode: 'NULLABLE' }]);
});
