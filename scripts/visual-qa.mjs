import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../qa');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = { url: 'http://127.0.0.1:4173/', viewports: {}, consoleErrors: [], pageErrors: [] };

for (const [name, viewport] of Object.entries({ desktop: { width: 1440, height: 1000 }, mobile: { width: 390, height: 844 } })) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: name === 'mobile' ? 2 : 1 });
  page.on('console', msg => { if (msg.type() === 'error') report.consoleErrors.push(`${name}: ${msg.text()}`); });
  page.on('pageerror', err => report.pageErrors.push(`${name}: ${err.message}`));
  const response = await page.goto(report.url, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  const metrics = await page.evaluate(() => {
    const canvas = document.querySelector('#bj-canvas');
    const c = canvas.getContext('2d');
    const sample = c.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
    return {
      status: document.readyState,
      viewport: [innerWidth, innerHeight],
      documentSize: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      canvas: [canvas.width, canvas.height],
      canvasCenterPixel: [...sample],
      headings: [...document.querySelectorAll('h1,h2')].map(h => h.textContent.replace(/\s+/g, ' ').trim()),
      fontsLoaded: document.fonts.status,
      brokenImages: [...document.images].filter(i => !i.complete || !i.naturalWidth).length
    };
  });
  report.viewports[name] = { httpStatus: response.status(), ...metrics };
  await page.screenshot({ path: path.join(out, `${name}-full.png`), fullPage: true });
  await page.locator('.hero').screenshot({ path: path.join(out, `${name}-hero.png`) });
  if (name === 'desktop') {
    await page.locator('#feed').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /A BAD POEM/i }).click();
    await page.locator('#machine-status').waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.querySelector('#machine-status')?.textContent === 'SLOP COMPLETE');
    await page.locator('#feed').screenshot({ path: path.join(out, 'desktop-slop-machine.png') });
    await page.locator('#mark').screenshot({ path: path.join(out, 'desktop-product.png') });
  }
  await page.close();
}
await browser.close();
await fs.writeFile(path.join(out, 'visual-qa-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
