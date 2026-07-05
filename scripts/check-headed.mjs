// 带窗口的真实 Edge（非 headless）验证鼠标点击：菜单 -> 选关 -> 进关 -> 拉弓
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('shots', { recursive: true });
const url = process.argv[2] ?? 'http://localhost:4173/';

const browser = await chromium.launch({ channel: 'msedge', headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e)));

const S = 0.8;
const w = (x, y) => [x * S, y * S];

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(2500);
await page.screenshot({ path: 'shots/headed-01-menu.png' });

await page.mouse.click(...w(800, 480)); // 开始游戏
await page.waitForTimeout(900);
await page.screenshot({ path: 'shots/headed-02-levelselect.png' });

await page.mouse.click(...w(360, 300)); // 第 1 关
await page.waitForTimeout(1500);
await page.screenshot({ path: 'shots/headed-03-game.png' });

// 拉弓发射
await page.mouse.move(...w(250, 640));
await page.mouse.down();
await page.mouse.move(...w(140, 730), { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(1500);
await page.screenshot({ path: 'shots/headed-04-flight.png' });

console.log('console errors:', errors.length ? '\n' + errors.join('\n') : 'none');
await browser.close();
