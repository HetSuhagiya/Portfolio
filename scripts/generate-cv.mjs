/** Print the actual résumé page, keeping its content and the PDF in sync. Start the site first. */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const origin = process.env.PORTFOLIO_URL || 'http://localhost:3001';
const output = fileURLToPath(new URL('../public/Het_Suhagiya_CV.pdf', import.meta.url));
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('hs:seen', String(Date.now())));
  const response = await page.goto(`${origin}/resume?nogl=1`, { waitUntil: 'networkidle' });
  if (!response?.ok()) throw new Error(`Résumé page returned ${response?.status()}`);
  await page.locator('.resume-document').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  await page.evaluate((canonical) => {
    const origin = new URL(canonical).origin;
    document.querySelectorAll('.resume-document a[href^="/"]').forEach((link) => {
      link.setAttribute('href', new URL(link.getAttribute('href'), origin).href);
    });
  }, canonical);
  await mkdir(fileURLToPath(new URL('../public/', import.meta.url)), { recursive: true });
  await page.pdf({
    path: output,
    format: 'A4',
    printBackground: false,
    preferCSSPageSize: true,
    tagged: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate:
      '<div style="font-size:8px;width:100%;text-align:right;padding:0 14mm;color:#555">Het Suhagiya · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  });
  console.log(`Created ${output} from the existing résumé content.`);
} finally {
  await browser.close();
}
