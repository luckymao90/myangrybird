// 验证启动诊断：正常加载无横幅；JS 被拦截(模拟旧缓存404)时 10 秒后出现提示横幅
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('shots', { recursive: true });
const base = 'http://localhost:4173/';
const browser = await chromium.launch({ channel: 'msedge', headless: true });

// 场景 1：正常加载
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const booted = await page.evaluate(() => window.__gameBooted === true);
  const warnVisible = await page.locator('#boot-warn').isVisible();
  const badge = await page.locator('#ver-badge').textContent();
  console.log(`正常加载: booted=${booted} warn=${warnVisible} badge=${badge}`);
  await page.screenshot({ path: 'shots/diag-01-normal.png' });
  await page.close();
}

// 场景 2：模拟旧缓存——JS 404
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.route('**/assets/*.js', (r) => r.fulfill({ status: 404, body: 'Not Found' }));
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  const warnText = await page.locator('#boot-warn').textContent();
  const warnVisible = await page.locator('#boot-warn').isVisible();
  console.log(`JS 404: warn=${warnVisible} text=${warnText}`);
  await page.screenshot({ path: 'shots/diag-02-404.png' });
  await page.close();
}

await browser.close();
