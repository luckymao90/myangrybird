import Phaser from 'phaser';
import { FONT, GAME_WIDTH, GROUND_TOP } from '../config';
import { LEVELS } from '../levels';
import { getStars, unlockedUpTo } from '../save';
import { makeTextButton } from '../ui';
import { sfx } from '../audio';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create(): void {
    this.add.image(0, 0, 'bg').setOrigin(0);
    this.add.image(0, GROUND_TOP, 'ground').setOrigin(0);

    this.add
      .text(GAME_WIDTH / 2, 110, '选择关卡', {
        fontFamily: FONT,
        fontSize: '72px',
        color: '#ffffff',
        stroke: '#2c5b78',
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    const unlocked = unlockedUpTo(LEVELS.length);
    const cols = 5;
    const cellW = 220;
    const cellH = 210;
    const startX = GAME_WIDTH / 2 - ((cols - 1) * cellW) / 2;
    const startY = 300;

    LEVELS.forEach((level, i) => {
      const x = startX + (i % cols) * cellW;
      const y = startY + Math.floor(i / cols) * cellH;
      const isUnlocked = level.id <= unlocked;
      this.makeLevelCard(x, y, level.id, level.name, isUnlocked);
    });

    makeTextButton(
      this,
      120,
      70,
      150,
      66,
      '← 菜单',
      () => this.scene.start('Menu'),
      { fill: 0x4a90b8, fillDown: 0x3a769a, fontSize: 28 }
    );
  }

  private makeLevelCard(x: number, y: number, id: number, name: string, unlocked: boolean): void {
    const w = 180;
    const h = 170;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.22);
    g.fillRoundedRect(x - w / 2 + 3, y - h / 2 + 5, w, h, 16);
    g.fillStyle(unlocked ? 0xf2820a : 0x8b959d, 1);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 16);
    g.lineStyle(3, 0xffffff, 0.35);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 16);

    if (unlocked) {
      this.add
        .text(x, y - 38, String(id), {
          fontFamily: FONT,
          fontSize: '58px',
          color: '#ffffff',
          stroke: '#00000044',
          strokeThickness: 4,
        })
        .setOrigin(0.5);
      this.add
        .text(x, y + 8, name, {
          fontFamily: FONT,
          fontSize: '22px',
          color: '#fff3e0',
        })
        .setOrigin(0.5);
      const stars = getStars(id);
      for (let s = 0; s < 3; s++) {
        this.add
          .image(x - 40 + s * 40, y + 52, s < stars ? 'star_on' : 'star_off')
          .setScale(0.5);
      }
      const zone = this.add
        .zone(x, y, w, h)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        sfx.click();
        this.scene.start('Game', { level: id });
      });
    } else {
      this.add
        .text(x, y - 8, '🔒', { fontSize: '52px' })
        .setOrigin(0.5);
      this.add
        .text(x, y + 48, `通关第 ${id - 1} 关解锁`, {
          fontFamily: FONT,
          fontSize: '18px',
          color: '#e8edf0',
        })
        .setOrigin(0.5);
    }
  }
}
