import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, GRAVITY_Y } from './config';
import { unlockAudio } from './audio';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { GameScene } from './scenes/GameScene';

// 移动端浏览器要求首次用户手势后才能出声
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('touchstart', unlockAudio);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#69b9e8',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3,
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: GRAVITY_Y },
      enableSleeping: true,
      positionIterations: 10,
      velocityIterations: 8,
    },
  },
  scene: [BootScene, MenuScene, LevelSelectScene, GameScene],
});

// 通知 index.html 的启动看门狗：游戏已正常启动
game.events.once(Phaser.Core.Events.READY, () => {
  const w = window as unknown as { __gameBooted?: boolean; __hideBootWarn?: () => void };
  w.__gameBooted = true;
  w.__hideBootWarn?.();
  console.log('怒鸟出击 v1.2 已启动');
});

// 手机转屏/浏览器工具栏收起后布局会变，延迟刷新 Scale 以校正画布尺寸与输入坐标
const refreshScale = () => {
  game.scale.refresh();
  setTimeout(() => game.scale.refresh(), 120);
  setTimeout(() => game.scale.refresh(), 500);
};
window.addEventListener('orientationchange', refreshScale);
window.addEventListener('resize', refreshScale);
// 地址栏收起/页面缩放只更新 visualViewport，不一定触发 window resize
window.visualViewport?.addEventListener('resize', refreshScale);
window.visualViewport?.addEventListener('scroll', refreshScale);
// 兜底：每次按下前（捕获阶段先于 Phaser 处理）刷新画布边界，杜绝触点坐标错位
const syncBounds = () => game.scale.refresh();
window.addEventListener('pointerdown', syncBounds, true);
window.addEventListener('touchstart', syncBounds, { capture: true, passive: true });
