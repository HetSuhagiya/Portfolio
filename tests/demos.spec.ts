import { test, expect, type Page } from '@playwright/test';
const routes = [
  'publicis-groupe',
  'pantherella',
  'christopher-ward',
  'dashworx-data-platform',
  'yew-technologies',
  'schema-inference-platform',
];
async function openDemo(page: Page, slug: string) {
  await page.addInitScript(() => localStorage.setItem('hs:seen', String(Date.now())));
  await page.goto(`/work/${slug}?nogl=1`);
  await page.locator('.approach').scrollIntoViewIfNeeded();
  await expect(page.locator('.demo')).toBeVisible();
  await expect(page.getByText('// this demo is not built yet', { exact: true })).toHaveCount(0);
  return page.locator('.demo');
}

test('report cross-filters KPIs and other charts, then resets', async ({ page }) => {
  const demo = await openDemo(page, routes[0]!);
  await expect(demo.locator('.demo-metrics')).toContainText('162');
  await expect(demo.getByRole('button', { name: /^Atlas/ })).toHaveCount(0);
  await demo.getByRole('button', { name: 'Explore finished report' }).click();
  const before = await demo.locator('.demo-metrics').innerText();
  await demo.getByRole('button', { name: /^Atlas/ }).click();
  await expect(demo.getByRole('status')).toContainText('Atlas: 54 rows');
  expect(await demo.locator('.demo-metrics').innerText()).not.toEqual(before);
  await demo.getByRole('button', { name: 'Channel', exact: true }).click();
  await demo.getByRole('button', { name: /^Email/ }).click();
  await expect(demo.locator('.demo-metrics')).toContainText('£4.00');
  await demo.getByRole('button', { name: 'Reset demo' }).click();
  await demo.getByRole('button', { name: 'Explore finished report' }).click();
  expect(await demo.locator('.demo-metrics').innerText()).toEqual(before);
});
test('KPI sliders work with keyboard and reset to the baseline', async ({ page }) => {
  const demo = await openDemo(page, routes[1]!);
  await expect(demo.locator('.demo-tree-root')).toContainText('£32,700');
  const slider = demo.getByRole('slider', { name: /Conversion rate/ });
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(demo.locator('.demo-tree-root')).toContainText('£34,063');
  await demo.getByRole('button', { name: 'Reset demo' }).click();
  await expect(demo.locator('.demo-tree-root')).toContainText('£32,700');
});
test('comparison controls and validation gate respond', async ({ page }) => {
  const demo = await openDemo(page, routes[2]!);
  await demo.getByRole('button', { name: 'Compare both' }).click();
  const slider = demo.getByRole('slider', { name: /Comparison divider/ });
  await expect(slider).toHaveValue('50');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('51');
  const handle = demo.getByRole('button', { name: /Drag comparison divider/ });
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x - 80, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  expect(Number(await slider.inputValue())).toBeLessThan(51);
  await demo.getByRole('button', { name: 'Introduce a £100 mismatch' }).click();
  await expect(demo.getByRole('status')).toContainText('Publish blocked');
  await demo.getByRole('button', { name: 'Restore matching totals' }).click();
  await expect(demo.getByRole('status')).toContainText('Check passed');
});
test('reconciliation explains incorrect choices and applies the real correction', async ({ page }) => {
  const demo = await openDemo(page, routes[3]!);
  await demo.getByRole('button', { name: 'Currency mismatch', exact: true }).click();
  await expect(demo.getByRole('status')).toContainText('All rows are in GBP');
  await demo.getByRole('button', { name: 'Duplicate order', exact: true }).click();
  await demo.getByRole('button', { name: 'Exclude duplicate and reconcile' }).click();
  await expect(demo.getByRole('status')).toContainText('both totals are £480');
  await demo.getByRole('button', { name: 'Reset demo' }).click();
  await expect(demo.locator('.demo-metrics')).toContainText('£690');
});
test('retail filters update dots, counts and summaries', async ({ page }) => {
  const demo = await openDemo(page, routes[4]!);
  await expect(demo.locator('.demo-metrics')).toContainText('10,000');
  await demo.getByRole('combobox', { name: 'Category', exact: true }).selectOption('Home');
  await demo.getByRole('combobox', { name: 'Month', exact: true }).selectOption('Mar');
  await expect(demo.locator('.demo-metrics')).not.toContainText('10,000');
  await expect(demo.getByRole('row', { name: /Everyday tee/ })).toHaveCount(0);
  await expect(demo.getByRole('row', { name: /Desk lamp/ })).toBeVisible();
  await demo.getByRole('button', { name: 'Reset demo' }).click();
  await expect(demo.locator('.demo-metrics')).toContainText('10,000');
});
test('schema inference runs, preserves mixed values and emits JSON', async ({ page }) => {
  const demo = await openDemo(page, routes[5]!);
  await demo.getByRole('button', { name: 'Try a mixed-type amount' }).click();
  await expect(demo.getByRole('status').first()).toContainText('entire amount column stays STRING');
  await demo.getByRole('button', { name: 'View schema JSON' }).click();
  await expect(demo.locator('pre')).toContainText('STRING');
  await expect(demo.getByRole('cell', { name: /twelve/ })).toBeVisible();
  await demo.getByRole('button', { name: 'Restore numeric amount' }).click();
  const schema = JSON.parse((await demo.locator('pre').textContent())!);
  expect(schema.find((c: { name: string }) => c.name === 'amount')).toEqual({
    name: 'amount',
    type: 'FLOAT',
    mode: 'NULLABLE',
  });
});

test('all demos fit 320px and expose named controls without runtime errors', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const route of routes) {
    const demo = await openDemo(page, route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(
      true,
    );
    expect(
      await demo
        .locator('button')
        .evaluateAll((buttons) =>
          buttons.every((b) => !!(b.getAttribute('aria-label') || b.textContent)?.trim()),
        ),
    ).toBe(true);
    await demo.getByRole('button', { name: 'Reset demo' }).click();
  }
  expect(errors).toEqual([]);
});

test('pinned desktop workspaces remain scrollable and reset is reachable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const route of routes) {
    const demo = await openDemo(page, route);
    await page.evaluate(() => {
      const a = document.querySelector('.approach')!;
      window.scrollTo(0, a.getBoundingClientRect().top + window.scrollY);
    });
    await expect(demo).toHaveAttribute('data-pinned', 'true');
    const body = demo.locator('.demo-body');
    expect(await body.evaluate((el) => el.clientHeight > 100)).toBe(true);
    await body.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await demo.getByRole('button', { name: 'Reset demo' }).click();
  }
});
