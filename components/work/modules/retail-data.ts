/** Deterministic retail sample, loaded only by the 10,000 sales demo. */
export const categories = ['Essentials', 'Home', 'Outdoor', 'Accessories'];
export const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
export const products = [
  { name: 'Everyday tee', category: 'Essentials', price: 24, stock: 80 },
  { name: 'Cotton socks', category: 'Essentials', price: 12, stock: 350 },
  { name: 'Desk lamp', category: 'Home', price: 45, stock: 40 },
  { name: 'Linen throw', category: 'Home', price: 65, stock: 240 },
  { name: 'Trail bottle', category: 'Outdoor', price: 28, stock: 65 },
  { name: 'Day pack', category: 'Outdoor', price: 78, stock: 180 },
  { name: 'Canvas tote', category: 'Accessories', price: 18, stock: 50 },
  { name: 'Wool scarf', category: 'Accessories', price: 38, stock: 200 },
];
export type Sale = {
  id: number;
  product: number;
  category: string;
  month: string;
  quantity: number;
  sales: number;
};
function random(seed: number) {
  let x = seed;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 4294967296;
  };
}
const rand = random(1409);
export const sales: Sale[] = Array.from({ length: 10000 }, (_, id) => {
  const product = Math.floor(rand() * products.length);
  const p = products[product]!;
  // A growing sales trend, with more transactions in later months.
  const month = months[Math.min(5, Math.floor(Math.sqrt(rand()) * 6))]!;
  const quantity = rand() > 0.8 ? 2 : 1;
  return { id, product, category: p.category, month, quantity, sales: p.price * quantity };
});
export function retailSummary(rows: Sale[], monthCount: number) {
  const ranked = products
    .map((p, index) => {
      const units = rows.filter((r) => r.product === index).reduce((s, r) => s + r.quantity, 0);
      const weeks = (monthCount * 30) / 7;
      return { ...p, units, cover: units ? p.stock / (units / weeks) : Infinity };
    })
    .filter((p) => p.units > 0)
    .sort((a, b) => b.units - a.units);
  return { total: rows.reduce((s, r) => s + r.sales, 0), ranked, risk: ranked.filter((p) => p.cover < 4) };
}
