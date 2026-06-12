import puppeteer from 'puppeteer';
import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3];

const outDir = join(process.cwd(), 'temporary screenshots');
mkdirSync(outDir, { recursive: true });

const nums = readdirSync(outDir)
  .map((f) => /^screenshot-(\d+)/.exec(f))
  .filter(Boolean)
  .map((m) => Number(m[1]));
const n = (nums.length ? Math.max(...nums) : 0) + 1;
const outPath = join(outDir, `screenshot-${n}${label ? `-${label}` : ''}.png`);

const browser = await puppeteer.launch({ protocolTimeout: 180000 });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
// Scroll through the page so scroll-triggered animations fire, then return to top
await page.evaluate(async () => {
  const step = window.innerHeight / 2;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 120));
  }
  window.scrollTo(0, 0);
  // Ensure all scroll-reveal elements are visible for the capture
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
});
await new Promise((r) => setTimeout(r, 900));
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
console.log(outPath);
