// Capture each conversation showcase at iPhone-X width (375) and natural content height.
// Output: ./screenshots/{slug}.png at 2× DPR for crisp deck embedding.
//
// Usage:
//   1. Start dev server in another terminal: `npm run dev`
//   2. Install puppeteer ad-hoc (NOT a project dep, keeps lockfile small for CI):
//        npx --yes -p puppeteer node scripts/screenshot.mjs
//      Or one-time:  npm install --no-save puppeteer && node scripts/screenshot.mjs
//
// We deliberately keep puppeteer OUT of package.json so `npm ci` on GitHub Pages
// stays fast and never breaks on transitive deps.

import puppeteer from 'puppeteer';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 'http://localhost:5173/money-mitra-prototype/#';
const SLUGS = ['samjhao-priya', 'bachao-ravi', 'aage-badho-ravi'];
const OUT = resolve('screenshots');
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  defaultViewport: { width: 375, height: 812, deviceScaleFactor: 2 },
});

for (const slug of SLUGS) {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
  await page.goto(`${BASE}/${slug}`, { waitUntil: 'networkidle0', timeout: 20_000 });
  // Wait for Devanagari font to load
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 600));

  // Measure natural content height
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  // Resize viewport to fit all content, capture, save
  await page.setViewport({ width: 375, height: h, deviceScaleFactor: 2 });
  await new Promise(r => setTimeout(r, 200));
  const path = `${OUT}/${slug}.png`;
  await page.screenshot({ path, type: 'png' });
  console.log(`✓ ${slug}.png  (375×${h} @2x)`);
  await page.close();
}
await browser.close();
