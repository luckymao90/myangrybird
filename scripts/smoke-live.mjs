import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('https://luckymao90.github.io/myangrybird/', { waitUntil: 'load' });
await page.waitForTimeout(3500);
await page.screenshot({ path: 'shots/live-menu.png' });
await page.mouse.click(640, 384); // 开始游戏
await page.waitForTimeout(1000);
await page.mouse.click(288, 240); // 第 1 关
await page.waitForTimeout(1500);
await page.screenshot({ path: 'shots/live-game.png' });
console.log(errors.length ? 'ERRORS: ' + errors.join(' | ') : 'no console errors');
await browser.close();
