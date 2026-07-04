import Phaser from 'phaser';
import { FONT, GAME_HEIGHT, GAME_WIDTH, GROUND_TOP } from '../config';
import { isMuted, setMuted, sfx } from '../audio';
import { makeTextButton } from '../ui';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    this.add.image(0, 0, 'bg').setOrigin(0);
    this.add.image(0, GROUND_TOP, 'ground').setOrigin(0);

    const cx = GAME_WIDTH / 2;

    const title = this.add
      .text(cx, 220, '怒鸟出击', {
        fontFamily: FONT,
        fontSize: '130px',
        color: '#ffffff',
        stroke: '#b02a1c',
        strokeThickness: 14,
      })
      .setOrigin(0.5)
      .setShadow(0, 8, '#00000055', 12, false, true);
    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.04 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add
      .text(cx, 330, '拉弓！发射！拆猪窝！', {
        fontFamily: FONT,
        fontSize: '36px',
        color: '#2c5b78',
      })
      .setOrigin(0.5);

    makeTextButton(this, cx, 480, 320, 96, '开 始 游 戏', () => {
      this.scene.start('LevelSelect');
    });

    // 静音开关
    const muteBtn = makeTextButton(
      this,
      GAME_WIDTH - 80,
      70,
      88,
      72,
      isMuted() ? '♪✕' : '♪',
      () => {
        setMuted(!isMuted());
        const t = muteBtn.list[1] as Phaser.GameObjects.Text;
        t.setText(isMuted() ? '♪✕' : '♪');
      },
      { fill: 0x4a90b8, fillDown: 0x3a769a }
    );

    // 装饰：地面上的三只鸟和一只猪
    const decor: Array<[string, number, number]> = [
      ['bird_red', 420, GROUND_TOP - 32],
      ['bird_yellow', 520, GROUND_TOP - 30],
      ['bird_black', 620, GROUND_TOP - 35],
      ['pig', 1200, GROUND_TOP - 33],
    ];
    decor.forEach(([key, x, y], i) => {
      const img = this.add.image(x, y, key);
      this.tweens.add({
        targets: img,
        y: y - 14,
        duration: 700 + i * 120,
        yoyo: true,
        repeat: -1,
        delay: i * 150,
        ease: 'Quad.easeInOut',
      });
    });

    this.add
      .text(cx, GAME_HEIGHT - 30, '一个致敬经典的原创物理小游戏 · Phaser 3', {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#3d6a85',
      })
      .setOrigin(0.5);

    void sfx;
  }
}
