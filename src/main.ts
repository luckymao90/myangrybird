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

new Phaser.Game({
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
