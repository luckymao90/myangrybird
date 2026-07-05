// 模拟真实手机流程：竖屏打开 -> 旋转为横屏 -> 点"开始游戏"
// 用法: node scripts/check-rotate.mjs [url] [webkit|chromium]
// 注：WebKit 内核不走系统代理，访问外网可能失败；线上验证用 chromium
import { webkit, chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('shots', { recursive: true });
const url = process.argv[2] ?? 'https://luckymao90.github.io/myangrybird/';
const engine = process.argv[3] ?? 'webkit';

const browser =
  engine === 'chromium'
    ? await chromium.launch({ channel: 'msedge', headless: true })
    : await webkit.launch({ headless: true });
const ctx = await browser.newContext({
  ...devices[engine === 'chromium' ? 'Pixel 7' : 'iPhone 13'], // 竖屏
});
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e)));

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'shots/rot-01-portrait.png' });

// 旋转为横屏
await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(1500);
await page.screenshot({ path: 'shots/rot-02-landscape.png' });

const box = await page.locator('canvas').boundingBox();
console.log('canvas box after rotate:', JSON.stringify(box));
const toScreen = (x, y) => [box.x + (x / 1600) * box.width, box.y + (y / 900) * box.height];

await page.touchscreen.tap(...toScreen(800, 480));
await page.waitForTimeout(1500);
await page.screenshot({ path: 'shots/rot-03-after-tap.png' });

console.log('console errors:', errors.length ? '\n' + errors.join('\n') : 'none');
await browser.close();
