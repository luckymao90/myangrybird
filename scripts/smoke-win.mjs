// 胜利流程验证：用 DEV 调试钩子直接消灭猪，检查胜利结算/星级/下一关/结构稳定
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

const S = 0.8;
const w = (x, y) => [x * S, y * S];

await page.goto('http://localhost:5173', { waitUntil: 'load' });
await page.waitForTimeout(2200);
await page.mouse.click(...w(800, 480)); // 开始游戏
await page.waitForTimeout(800);
await page.mouse.click(...w(360, 300)); // 第 1 关
await page.waitForTimeout(1300);

// 直接结算全部猪（模拟全部命中）
const state1 = await page.evaluate(() => {
  const g = window.__game;
  while (g.pigs.length > 0) g.applyDamage(g.pigs[0], 99999);
  return { pigs: g.pigs.length, phase: g.phase, score: g.score };
});
console.log('after kill:', JSON.stringify(state1));
await page.waitForTimeout(2500); // 等胜利面板与星星动画
await page.screenshot({ path: 'shots/10-win.png' });

// 下一关
await page.mouse.click(...w(800, 610));
await page.waitForTimeout(1500);
await page.screenshot({ path: 'shots/11-level2.png' });
// 静置 5 秒验证玻璃小屋结构不自行倒塌
await page.waitForTimeout(5000);
await page.screenshot({ path: 'shots/12-level2-stable.png' });

const state2 = await page.evaluate(() => {
  const g = window.__game;
  return {
    level: g.levelId,
    pigs: g.pigs.length,
    blocks: g.blocks.map((b) => ({ x: Math.round(b.x), y: Math.round(b.y), a: Math.round(b.angle) })),
  };
});
console.log('level2 state:', JSON.stringify(state2));

console.log(errors.length ? `CONSOLE ERRORS (${errors.length}):\n` + errors.join('\n') : 'no console errors');
await browser.close();
