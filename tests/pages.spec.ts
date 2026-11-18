import { test, expect } from '@playwright/test';
const pages = [
  { path: '/about', title: 'The full story', theme: 'ink' },
  { path: '/work', title: 'Work', theme: 'ink' },
  { path: '/resume', title: 'Résumé', theme: 'paper' },
  { path: '/contact', title: 'Let’s talk', theme: 'ink' },
];
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hs:seen', String(Date.now())));
});
test('main pages load directly and after reload with canonical metadata and correct themes', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const p of pages) {
    const response = await page.goto(`${p.path}?nogl=1`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: p.title, level: 1 })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', p.theme);
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      `https://hetsuhagiya.com${p.path}`,
    );
    await page.reload();
    await expect(page.getByRole('heading', { name: p.title, level: 1 })).toBeVisible();
  }
  expect(errors).toEqual([]);
});
test('main menu routes to each page and browser back restores the previous page', async ({ page }) => {
  await page.goto('/?nogl=1');
  for (const p of pages) {
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    const link = page.getByRole('navigation', { name: 'Site', exact: true }).locator(`a[href="${p.path}"]`);
    await link.click();
    await expect(page).toHaveURL(p.path);
    await expect(page.getByRole('heading', { name: p.title, level: 1 })).toBeVisible();
    await expect(page.locator('#main')).toBeFocused();
  }
  await page.goBack();
  await expect(page).toHaveURL('/resume');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
});
test('work filters preserve all seven routes, including the internship', async ({ page }) => {
  await page.goto('/work?nogl=1');
  const cards = page.locator('.work-index-card');
  await expect(cards).toHaveCount(7);
  const paths = await cards.evaluateAll((links) => links.map((a) => a.getAttribute('href')));
  expect(paths).toContain('/work/yew-technologies');
  await page.getByRole('button', { name: /Built by me/ }).click();
  await expect(cards).toHaveCount(2);
  await page.getByRole('button', { name: /Client work/ }).click();
  await expect(cards).toHaveCount(4);
  await page.getByRole('button', { name: /^All/ }).click();
  await expect(cards).toHaveCount(7);
  await cards.filter({ hasText: 'Publicis Groupe' }).click();
  await expect(page).toHaveURL('/work/publicis-groupe');
  await expect(page.getByRole('heading', { name: 'Publicis Groupe', exact: true, level: 1 })).toBeVisible();
});
test('about toolkit supports keyboard selection and list view', async ({ page }) => {
  await page.goto('/about?nogl=1');
  await page.getByRole('button', { name: 'Tableau', exact: true }).focus();
  await expect(page.locator('.toolkit-detail')).toContainText('Publicis Groupe');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'View as list' }).click();
  await expect(page.locator('.toolkit-list')).toBeVisible();
  await expect(page.locator('.toolkit-list')).toContainText(/schema/i);
  await page.getByRole('button', { name: 'View as constellation' }).click();
  await expect(page.locator('.toolkit-map')).toBeVisible();
});
test('contact copies the real email and offers usable contact links', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/contact?nogl=1');
  await page.getByRole('button', { name: 'Copy email' }).click();
  await expect(page.getByRole('status')).toContainText('Copied to clipboard');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('hetsuhagiya1409@outlook.com');
  await expect(page.getByRole('link', { name: 'Email me ↗' })).toHaveAttribute(
    'href',
    'mailto:hetsuhagiya1409@outlook.com',
  );
  await expect(page.getByRole('link', { name: /Read résumé/ })).toHaveAttribute('href', '/resume');
});
test('resume prints cleanly and the PDF download is real', async ({ page, request }) => {
  await page.goto('/resume?nogl=1');
  await page.evaluate(() => {
    window.print = () => {
      document.body.dataset.printCalled = 'true';
    };
  });
  await page.getByRole('button', { name: 'Print résumé' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-print-called', 'true');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('footer')).not.toBeVisible();
  await expect(page.locator('.resume-name')).toBeVisible();
  await expect(page.locator('.edit-flag').first()).not.toBeVisible();
  const pdf = await request.get('/Het_CV.pdf');
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()['content-type']).toContain('application/pdf');
  expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');
});
test('missing routes show a recovery page with working destinations', async ({ page }) => {
  for (const path of ['/missing-page', '/work/missing-project']) {
    await page.goto(`${path}?nogl=1`);
    await expect(page.getByRole('heading', { name: 'Signal lost', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to the start ↗' })).toHaveAttribute('href', '/');
    await page.getByRole('link', { name: 'See the work ↗' }).click();
    await expect(page.getByRole('heading', { name: 'Work', exact: true, level: 1 })).toBeVisible();
  }
});
test('all main pages reflow at 320px and at a 200-percent-equivalent viewport', async ({ page }) => {
  for (const width of [320, 640]) {
    await page.setViewportSize({ width, height: 800 });
    for (const p of pages) {
      await page.goto(`${p.path}?nogl=1`);
      await expect(page.getByRole('heading', { name: p.title, level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  }
});

test('animated menu navigation switches themes and lands on the correct page', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/work?nogl=1');
  for (const p of [pages[2]!, pages[3]!, pages[0]!]) {
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('navigation', { name: 'Site', exact: true }).locator(`a[href="${p.path}"]`).click();
    await expect(page).toHaveURL(p.path);
    await expect(page.locator('html')).toHaveAttribute('data-theme', p.theme);
    await expect(page.locator('#main')).toBeFocused();
  }
});

test('contact clipboard failure provides a usable fallback', async ({ page }) => {
  await page.goto('/contact?nogl=1');
  await page.evaluate(() =>
    Object.defineProperty(navigator.clipboard, 'writeText', {
      value: () => Promise.reject(new Error('Clipboard blocked')),
    }),
  );
  await page.getByRole('button', { name: 'Copy email' }).click();
  await expect(page.getByRole('status')).toContainText('Select the email address');
  await expect(page.getByRole('link', { name: 'Email me ↗' })).toBeVisible();
});
