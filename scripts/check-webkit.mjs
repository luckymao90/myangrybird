// 用 WebKit(iOS Safari 同内核) 真触屏事件测试指定站点的"开始游戏"按钮
// 用法: node scripts/check-webkit.mjs [url]
import { webkit, devices } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('shots', { recursive: true });
const url = process.argv[2] ?? 'https://luckymao90.github.io/myangrybird/';

const browser = await webkit.launch({ headless: true });
const ctx = await browser.newContext({ ...devices['iPhone 13 landscape'] });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e)));

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(3500);
await page.screenshot({ path: 'shots/wk-01-menu.png' });

const box = await page.locator('canvas').boundingBox();
console.log('canvas box:', JSON.stringify(box));
const toScreen = (x, y) => [box.x + (x / 1600) * box.width, box.y + (y / 900) * box.height];

await page.touchscreen.tap(...toScreen(800, 480));
await page.waitForTimeout(1500);
await page.screenshot({ path: 'shots/wk-02-after-tap.png' });

console.log('console errors:', errors.length ? '\n' + errors.join('\n') : 'none');
await browser.close();
