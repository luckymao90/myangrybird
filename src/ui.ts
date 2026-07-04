// 简单的圆角按钮（Graphics + Text 组合）
import Phaser from 'phaser';
import { FONT } from './config';
import { sfx } from './audio';

export interface ButtonOptions {
  fill?: number;
  fillDown?: number;
  textColor?: string;
  fontSize?: number;
}

export function makeTextButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  onClick: () => void,
  opts: ButtonOptions = {}
): Phaser.GameObjects.Container {
  const fill = opts.fill ?? 0xf2820a;
  const fillDown = opts.fillDown ?? 0xd96e00;
  const fontSize = opts.fontSize ?? Math.round(h * 0.42);

  const g = scene.add.graphics();
  const draw = (color: number) => {
    g.clear();
    g.fillStyle(0x00000, 0.25);
    g.fillRoundedRect(-w / 2 + 3, -h / 2 + 5, w, h, 14);
    g.fillStyle(color, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    g.lineStyle(3, 0xffffff, 0.35);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
  };
  draw(fill);

  const txt = scene.add
    .text(0, 0, label, {
      fontFamily: FONT,
      fontSize: `${fontSize}px`,
      color: opts.textColor ?? '#ffffff',
      stroke: '#00000055',
      strokeThickness: 3,
    })
    .setOrigin(0.5);

  const container = scene.add.container(x, y, [g, txt]);
  container.setSize(w, h);
  container.setInteractive(
    new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
    Phaser.Geom.Rectangle.Contains
  );

  const restore = () => {
    draw(fill);
    container.setScale(1);
  };
  // 在 pointerdown 直接触发：真机触屏上 pointerup 可能因手指微滑/pointercancel 丢失
  container.on(
    'pointerdown',
    (
      _p: Phaser.Input.Pointer,
      _x: number,
      _y: number,
      event: Phaser.Types.Input.EventData
    ) => {
      event.stopPropagation();
      draw(fillDown);
      container.setScale(0.96);
      sfx.click();
      onClick();
    }
  );
  container.on('pointerup', restore);
  container.on('pointerout', restore);

  return container;
}
