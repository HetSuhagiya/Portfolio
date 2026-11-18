/** Deterministic synthetic datasets and calculations shared by the interactive demos. */
export const money = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);
export const number = (n: number) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(n);
export type Dimension = 'brand' | 'region' | 'channel';
export type MarketingRow = {
  brand: string;
  region: string;
  channel: string;
  month: string;
  spend: number;
  conversions: number;
  revenue: number;
};
export const marketing: MarketingRow[] = Array.from({ length: 162 }, (_, i) => {
  const brand = ['Atlas', 'Forma', 'North'][i % 3]!;
  const region = ['UK', 'Europe', 'North America'][Math.floor(i / 3) % 3]!;
  const channel = ['Search', 'Social', 'Email'][Math.floor(i / 9) % 3]!;
  const m = Math.floor(i / 27);
  const conversions = 24 + ((i * 17) % 61) + m * 5;
  return {
    brand,
    region,
    channel,
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][m]!,
    conversions,
    spend: conversions * (channel === 'Email' ? 4 : channel === 'Search' ? 13 : 19),
    revenue: conversions * (45 + (i % 3) * 12),
  };
});
export function marketingTotals(rows: MarketingRow[]) {
  const t = rows.reduce(
    (a, r) => ({
      spend: a.spend + r.spend,
      conversions: a.conversions + r.conversions,
      revenue: a.revenue + r.revenue,
    }),
    { spend: 0, conversions: 0, revenue: 0 },
  );
  return { ...t, cpa: t.conversions ? t.spend / t.conversions : 0 };
}
export function groupMarketing(rows: MarketingRow[], dimension: Dimension | 'month') {
  const keys = [...new Set(rows.map((r) => r[dimension]))];
  return keys.map((label) => ({ label, ...marketingTotals(rows.filter((r) => r[dimension] === label)) }));
}
export const baseSessions = [12000, 8000, 5000];
export const productPrices = [35, 65, 95];
export function revenueModel(sessions: number[], conversion: number, mix: number[]) {
  const totalSessions = sessions.reduce((a, b) => a + b, 0);
  const weight = mix.reduce((a, b) => a + b, 0);
  const aov = weight ? mix.reduce((sum, value, i) => sum + value * productPrices[i]!, 0) / weight : 0;
  const orders = (totalSessions * conversion) / 100;
  return { sessions: totalSessions, orders, aov, revenue: orders * aov };
}
export type ReconciliationRow = { id: string; amount: number; currency: string; date: string };
export const reconciliationRows: ReconciliationRow[] = [
  { id: '1041', amount: 120, currency: 'GBP', date: '2026-06-10' },
  { id: '1042', amount: 85, currency: 'GBP', date: '2026-06-10' },
  { id: '1043', amount: 210, currency: 'GBP', date: '2026-06-10' },
  { id: '1043', amount: 210, currency: 'GBP', date: '2026-06-10' },
  { id: '1044', amount: 65, currency: 'GBP', date: '2026-06-10' },
];
export function reconcile(rows: ReconciliationRow[]) {
  const unique = [...new Map(rows.map((r) => [r.id, r])).values()];
  return {
    raw: rows.reduce((s, r) => s + r.amount, 0),
    clean: unique.reduce((s, r) => s + r.amount, 0),
    removed: rows.length - unique.length,
  };
}
