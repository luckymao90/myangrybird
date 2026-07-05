// 复现结算弹窗按钮问题：进第 1 关 -> 强制触发失败弹窗 -> 点"重玩"/"选关"，检查是否响应
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('shots', { recursive: true });
const base = process.argv[2] ?? 'http://localhost:5173/';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});

const S = 0.8;
const w = (x, y) => [x * S, y * S];

await page.goto(base, { waitUntil: 'load' });
await page.waitForTimeout(2500);
await page.mouse.click(...w(800, 480)); // 开始游戏
await page.waitForTimeout(900);
await page.mouse.click(...w(360, 300)); // 第 1 关
await page.waitForTimeout(2000);

// 强制触发失败弹窗
await page.evaluate(() => {
  const g = window.__game;
  g.queue = [];
  g.phase = 'flight';
  g.showLose();
});
await page.waitForTimeout(800);
await page.screenshot({ path: 'shots/lose-01-overlay.png' });

// 点"重玩" world(700,615)
await page.mouse.click(...w(700, 615));
await page.waitForTimeout(1500);
const afterReplay = await page.evaluate(() => ({
  phase: window.__game?.phase,
  score: window.__game?.score,
  blocks: window.__game?.blocks?.length,
}));
console.log('点击重玩后:', JSON.stringify(afterReplay), '(期望 phase=aim 表示已重开)');
await page.screenshot({ path: 'shots/lose-02-after-replay.png' });

// 若重玩成功，再触发一次失败弹窗，点"选关" world(900,615)
if (afterReplay.phase === 'aim') {
  await page.evaluate(() => {
    const g = window.__game;
    g.queue = [];
    g.phase = 'flight';
    g.showLose();
  });
  await page.waitForTimeout(800);
  await page.mouse.click(...w(900, 615));
  await page.waitForTimeout(1200);
  const scenes = await page.evaluate(() =>
    window.__game.scene.manager.getScenes(true).map((s) => s.scene.key)
  );
  console.log('点击选关后活动场景:', JSON.stringify(scenes), '(期望包含 LevelSelect)');
  await page.screenshot({ path: 'shots/lose-03-after-select.png' });
}

console.log('errors:', errors.length ? '\n' + errors.join('\n') : 'none');
await browser.close();
