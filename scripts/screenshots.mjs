// Capture the running application, with no mocked API responses or fabricated charts.
import { chromium, expect } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const folder = fileURLToPath(new URL('../docs/screenshots/', import.meta.url));
mkdirSync(folder, { recursive: true });
const credentials = JSON.parse(readFileSync(new URL('../.runtime/demo-credentials.json', import.meta.url)));
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, locale: 'en-GB', timezoneId: 'Asia/Dhaka', deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
async function capture(name, url, ready) {
  await page.goto(url);
  await ready();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${folder}/${name}.png`, fullPage: true });
  console.log(`Captured ${name}`);
}
try {
  await capture('dashboard', 'http://localhost:5173/Dashboard', () => page.getByRole('cell', { name: 'SIBL', exact: true }).waitFor());
  // Verify search really filters the table, then restore it.
  const search = page.getByPlaceholder(/search/i).first();
  await search.fill('MISSING-SYMBOL');
  await expect(page.getByRole('cell', { name: 'SIBL', exact: true })).toHaveCount(0);
  await search.fill('');
  const login = await context.request.post('http://localhost:8080/login', { data: credentials.user });
  if (!(await login.json()).success) throw new Error('Demo user login failed');
  await capture('stock-details', 'http://localhost:5173/stocks/SIBL', async () => {
    await page.getByRole('heading', { name: 'Social Islami Bank PLC' }).waitFor();
    await page.getByText('Loading chart…').first().waitFor({ state: 'hidden', timeout: 30000 });
  });
  await page.getByRole('button', { name: 'Buy', exact: true }).first().click();
  await page.getByRole('heading', { name: 'Trading Form', exact: true }).waitFor();
  await page.getByText('Loading orders…').waitFor({ state: 'hidden' });
  await page.screenshot({ path: `${folder}/trade-form.png`, fullPage: false });
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await capture('funding-request', 'http://localhost:5173/money-request', () => page.getByText('DEMO-ONLY-001', { exact: true }).waitFor());
  await capture('portfolio', 'http://localhost:5173/Profile', () => page.getByRole('cell', { name: 'SIBL', exact: true }).waitFor());
  await capture('sectors', 'http://localhost:5173/Sectors', async () => {
    await page.getByText('Bank', { exact: true }).first().waitFor();
    await page.getByText('Bank', { exact: true }).first().click();
    await page.getByRole('cell', { name: 'SIBL', exact: true }).waitFor();
  });
  await capture('ai-advisor', 'http://localhost:5173/ai-advisor', async () => {
    await page.getByText('AI Financial Advisor', { exact: true }).waitFor();
    await page.getByRole('textbox', { name: 'Stock search input' }).fill('SIBL');
    await page.getByRole('option').filter({ hasText: 'SIBL' }).click();
  });
  const adminLogin = await context.request.post('http://localhost:8081/admin/auth/login', { data: credentials.admin });
  if (!(await adminLogin.json()).success) throw new Error('Demo admin login failed');
  await capture('admin-requests', 'http://localhost:5174/admin/requests', () => page.getByText('DEMO-ONLY-001', { exact: true }).waitFor());
  await capture('admin-bulk-fetch', 'http://localhost:5174/admin/bulk-fetch', () => page.getByRole('heading', { name: /bulk/i }).first().waitFor());
  await capture('market-data-api', 'http://localhost:8000/docs', () => page.getByText('Bloomfolio Market Data API', { exact: false }).first().waitFor());
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`);
  console.log('PASS rendered pages, table search, user/admin login; no uncaught browser errors.');
} finally { await browser.close(); }
