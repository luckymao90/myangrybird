// 验证：摧毁支撑积木后，上方休眠的猪应当塌落（针对 enableSleeping 的唤醒修复）
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

const S = 0.8;
const w = (x, y) => [x * S, y * S];

await page.goto('http://localhost:5173', { waitUntil: 'load' });
await page.waitForTimeout(2500);
await page.mouse.click(...w(800, 480)); // 开始游戏
await page.waitForTimeout(900);
await page.mouse.click(...w(360, 300)); // 第 1 关
await page.waitForTimeout(3500); // 等物理稳定、刚体入睡

const before = await page.evaluate(() => {
  const g = window.__game;
  const pig = g.pigs.find((p) => Math.abs(p.x - 1250) < 40); // 箱子上的猪
  const block = g.blocks[0];
  return {
    pigY: pig?.y,
    pigSleeping: pig?.body?.isSleeping,
    pigCount: g.pigs.length,
    blockCount: g.blocks.length,
  };
});
console.log('before:', JSON.stringify(before));

// 记录猪参与的碰撞冲击值，用于伤害调参
await page.evaluate(() => {
  window.__impacts = [];
  const g = window.__game;
  g.matter.world.on('collisionstart', (ev) => {
    for (const pair of ev.pairs) {
      const a = pair.bodyA;
      const b = pair.bodyB;
      if (a.label === 'pig' || b.label === 'pig') {
        const impact = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
        window.__impacts.push({ pair: `${a.label}|${b.label}`, impact: +impact.toFixed(2) });
      }
    }
  });
});

await page.evaluate(() => {
  const g = window.__game;
  g.destroyBlock(g.blocks[0]); // 直接摧毁支撑箱
});
await page.waitForTimeout(1500);

const impacts = await page.evaluate(() => window.__impacts);
console.log('猪的碰撞记录:', JSON.stringify(impacts));

const after = await page.evaluate(() => {
  const g = window.__game;
  const pig = g.pigs.find((p) => Math.abs(p.x - 1250) < 60);
  return { pigY: pig?.y, pigCount: g.pigs.length, blockCount: g.blocks.length };
});
console.log('after :', JSON.stringify(after));

// v1.2 起：猪从箱子高度摔到地面应直接摔死（PIG_STATIC_DMG_MULT）
const died = after.pigCount === before.pigCount - 1;
console.log(before.pigSleeping ? '猪摧毁前处于休眠 ✓' : '注意：摧毁前猪未休眠（测试可能不充分）');
console.log(
  died
    ? `PASS: 猪塌落并摔死 (${before.pigCount} -> ${after.pigCount})`
    : `FAIL: 猪未摔死 (pigY ${before.pigY?.toFixed(0)} -> ${after.pigY?.toFixed(0)}, count ${before.pigCount} -> ${after.pigCount})`
);
if (errors.length) console.log('pageerrors:\n' + errors.join('\n'));
await browser.close();
process.exit(died ? 0 : 1);
