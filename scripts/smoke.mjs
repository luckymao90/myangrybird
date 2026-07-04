// 冒烟测试：驱动无头 Edge 玩一遍第 1 关的发射流程
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('shots', { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(String(e)));

// 画布 1600x900 FIT 到 1280x720，坐标缩放 0.8
const S = 0.8;
const w = (x, y) => [x * S, y * S];

await page.goto('http://localhost:5173', { waitUntil: 'load' });
await page.waitForTimeout(2500);
await page.screenshot({ path: 'shots/01-menu.png' });

// 主菜单：开始游戏按钮 world(800,480)
await page.mouse.click(...w(800, 480));
await page.waitForTimeout(900);
await page.screenshot({ path: 'shots/02-levelselect.png' });

// 第 1 关卡片 world(360,300)
await page.mouse.click(...w(360, 300));
await page.waitForTimeout(1400);
await page.screenshot({ path: 'shots/03-game.png' });

// 拖弓：从锚点 world(250,640) 拉到 world(140,730) 后松手
await page.mouse.move(...w(250, 640));
await page.mouse.down();
await page.mouse.move(...w(140, 730), { steps: 12 });
await page.waitForTimeout(250);
await page.screenshot({ path: 'shots/04-drag.png' });
await page.mouse.up();
await page.waitForTimeout(1000);
await page.screenshot({ path: 'shots/05-in-flight.png' });
await page.waitForTimeout(8500);
await page.screenshot({ path: 'shots/06-next-bird.png' });

console.log(errors.length ? `CONSOLE ERRORS (${errors.length}):\n` + errors.join('\n') : 'no console errors');
await browser.close();
