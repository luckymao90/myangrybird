// 程序化生成全部游戏纹理（零素材文件）
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config';

export type Material = 'wood' | 'stone' | 'glass';
export type BlockShape = 'plank' | 'beam' | 'box' | 'small' | 'column';

export const BLOCK_DIMS: Record<BlockShape, { w: number; h: number }> = {
  plank: { w: 200, h: 36 },
  beam: { w: 120, h: 36 },
  box: { w: 72, h: 72 },
  small: { w: 44, h: 44 },
  column: { w: 36, h: 130 },
};

const MAT_COLORS: Record<Material, { fill: number; stroke: number; detail: number }> = {
  wood: { fill: 0xc98d4b, stroke: 0x8a5a2b, detail: 0x9c6b34 },
  stone: { fill: 0xa9adb2, stroke: 0x6f7378, detail: 0x8d9196 },
  glass: { fill: 0xbfe6f5, stroke: 0x7fb8d4, detail: 0xffffff },
};

export function generateAllTextures(scene: Phaser.Scene): void {
  const g = scene.add.graphics();

  drawBackground(scene, g);
  drawGround(g);
  drawSlingshot(g);
  drawBirdRed(g);
  drawBirdYellow(g);
  drawBirdBlack(g);
  drawPig(g);
  for (const mat of ['wood', 'stone', 'glass'] as Material[]) {
    for (const shape of Object.keys(BLOCK_DIMS) as BlockShape[]) {
      drawBlockTexture(g, mat, shape);
    }
    drawDebris(g, mat);
  }
  drawParticles(g);
  drawStars(g);

  g.destroy();
}

function drawBackground(scene: Phaser.Scene, g: Phaser.GameObjects.Graphics): void {
  g.clear();
  // 天空渐变（用色带插值绘制，兼容 Canvas 与 WebGL 两种渲染器）
  const top = Phaser.Display.Color.ValueToColor(0x69b9e8);
  const bottom = Phaser.Display.Color.ValueToColor(0xc8e9fa);
  const strips = 24;
  const stripH = Math.ceil(GAME_HEIGHT / strips);
  for (let i = 0; i < strips; i++) {
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, strips - 1, i);
    g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
    g.fillRect(0, i * stripH, GAME_WIDTH, stripH + 1);
  }
  // 太阳
  g.fillStyle(0xfff3b0, 0.95);
  g.fillCircle(1380, 130, 66);
  g.fillStyle(0xffec8f, 0.45);
  g.fillCircle(1380, 130, 88);
  // 云朵
  const cloud = (x: number, y: number, s: number) => {
    g.fillStyle(0xffffff, 0.92);
    g.fillEllipse(x, y, 150 * s, 52 * s);
    g.fillEllipse(x - 45 * s, y + 8 * s, 90 * s, 40 * s);
    g.fillEllipse(x + 50 * s, y + 6 * s, 100 * s, 44 * s);
    g.fillEllipse(x + 5 * s, y - 18 * s, 90 * s, 46 * s);
  };
  cloud(260, 140, 1);
  cloud(760, 90, 0.8);
  cloud(1160, 210, 0.65);
  cloud(520, 260, 0.5);
  // 远山
  g.fillStyle(0xa5d68f, 1);
  g.fillEllipse(280, 880, 900, 320);
  g.fillStyle(0x8cc879, 1);
  g.fillEllipse(1150, 910, 1200, 360);
  g.generateTexture('bg', GAME_WIDTH, GAME_HEIGHT);
}

function drawGround(g: Phaser.GameObjects.Graphics): void {
  g.clear();
  g.fillStyle(0xb98d5a, 1);
  g.fillRect(0, 0, GAME_WIDTH, 100);
  g.fillStyle(0x74c14e, 1);
  g.fillRect(0, 0, GAME_WIDTH, 26);
  g.fillStyle(0x5aa63a, 1);
  g.fillRect(0, 22, GAME_WIDTH, 8);
  // 泥土里的小石子
  g.fillStyle(0xa07946, 1);
  for (let i = 0; i < 40; i++) {
    const x = (i * 397) % GAME_WIDTH;
    const y = 40 + ((i * 173) % 50);
    g.fillCircle(x, y, 3 + (i % 3));
  }
  g.generateTexture('ground', GAME_WIDTH, 100);
}

function drawSlingshot(g: Phaser.GameObjects.Graphics): void {
  // 90x170，底部中心对准地面
  g.clear();
  g.lineStyle(15, 0x7a4a21, 1);
  g.lineBetween(45, 165, 45, 92); // 主干
  g.lineBetween(45, 96, 19, 22); // 左叉
  g.lineBetween(45, 96, 71, 22); // 右叉
  g.lineStyle(9, 0x9c6430, 1);
  g.lineBetween(45, 160, 45, 94);
  g.lineBetween(45, 96, 21, 25);
  g.lineBetween(45, 96, 69, 25);
  g.generateTexture('sling', 90, 170);
}

function birdFace(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  browColor: number
): void {
  // 眼睛
  g.fillStyle(0xffffff, 1);
  g.fillCircle(cx - 7, cy - 7, 7.5);
  g.fillCircle(cx + 8, cy - 7, 7.5);
  g.fillStyle(0x1c1c1c, 1);
  g.fillCircle(cx - 5, cy - 6, 3.2);
  g.fillCircle(cx + 10, cy - 6, 3.2);
  // 怒眉（内低外高）
  g.fillStyle(browColor, 1);
  g.fillPoints(
    [
      { x: cx - 16, y: cy - 20 },
      { x: cx - 1, y: cy - 13 },
      { x: cx - 1, y: cy - 8 },
      { x: cx - 16, y: cy - 15 },
    ],
    true
  );
  g.fillPoints(
    [
      { x: cx + 17, y: cy - 20 },
      { x: cx + 2, y: cy - 13 },
      { x: cx + 2, y: cy - 8 },
      { x: cx + 17, y: cy - 15 },
    ],
    true
  );
  // 喙
  g.fillStyle(0xf59d00, 1);
  g.fillTriangle(cx - 4, cy + 1, cx + 20, cy + 6, cx - 4, cy + 12);
  g.lineStyle(2, 0xb37200, 1);
  g.strokeTriangle(cx - 4, cy + 1, cx + 20, cy + 6, cx - 4, cy + 12);
}

function drawBirdRed(g: Phaser.GameObjects.Graphics): void {
  g.clear();
  // 尾羽
  g.fillStyle(0x1c1c1c, 1);
  g.fillTriangle(2, 26, 16, 30, 8, 38);
  g.fillTriangle(2, 36, 16, 34, 8, 44);
  // 身体
  g.fillStyle(0xd63a2e, 1);
  g.fillCircle(34, 32, 26);
  g.lineStyle(3, 0x8f1f16, 1);
  g.strokeCircle(34, 32, 26);
  // 肚皮
  g.fillStyle(0xf2d8c0, 1);
  g.fillEllipse(34, 45, 26, 15);
  // 头顶羽毛
  g.fillStyle(0xd63a2e, 1);
  g.fillTriangle(28, 8, 34, -1, 38, 9);
  g.fillTriangle(34, 8, 42, 1, 44, 10);
  g.lineStyle(2, 0x8f1f16, 1);
  g.strokeTriangle(28, 8, 34, -1, 38, 9);
  birdFace(g, 36, 32, 0x5c120c);
  g.generateTexture('bird_red', 66, 62);
}

function drawBirdYellow(g: Phaser.GameObjects.Graphics): void {
  g.clear();
  // 三角形身体（查克）
  g.fillStyle(0xf7c531, 1);
  g.fillTriangle(33, 3, 4, 54, 62, 54);
  g.lineStyle(3, 0xa87b12, 1);
  g.strokeTriangle(33, 3, 4, 54, 62, 54);
  // 肚皮
  g.fillStyle(0xfbeccb, 1);
  g.fillTriangle(33, 30, 18, 53, 48, 53);
  // 头顶呆毛
  g.fillStyle(0x1c1c1c, 1);
  g.fillTriangle(28, 8, 24, -2, 34, 6);
  birdFace(g, 34, 30, 0x6b4a05);
  g.generateTexture('bird_yellow', 66, 58);
}

function drawBirdBlack(g: Phaser.GameObjects.Graphics): void {
  g.clear();
  // 引线
  g.lineStyle(4, 0x6f6f6f, 1);
  g.lineBetween(34, 12, 34, 3);
  g.fillStyle(0xffb027, 1);
  g.fillCircle(34, 3, 4);
  // 身体
  g.fillStyle(0x38383c, 1);
  g.fillCircle(34, 38, 27);
  g.lineStyle(3, 0x121214, 1);
  g.strokeCircle(34, 38, 27);
  // 灰色肚皮
  g.fillStyle(0x8f8f96, 1);
  g.fillEllipse(34, 52, 26, 14);
  // 头顶高光
  g.fillStyle(0x5a5a60, 1);
  g.fillEllipse(26, 22, 14, 8);
  birdFace(g, 36, 38, 0xc23b26);
  g.generateTexture('bird_black', 68, 68);
}

function drawPig(g: Phaser.GameObjects.Graphics): void {
  g.clear();
  // 耳朵
  g.fillStyle(0x6cb944, 1);
  g.fillCircle(18, 10, 8);
  g.fillCircle(50, 10, 8);
  g.lineStyle(2, 0x4e8a2f, 1);
  g.strokeCircle(18, 10, 8);
  g.strokeCircle(50, 10, 8);
  // 头
  g.fillStyle(0x7ccb52, 1);
  g.fillCircle(34, 34, 28);
  g.lineStyle(3, 0x4e8a2f, 1);
  g.strokeCircle(34, 34, 28);
  // 眼睛
  g.fillStyle(0xffffff, 1);
  g.fillCircle(22, 24, 6.5);
  g.fillCircle(46, 24, 6.5);
  g.fillStyle(0x1c1c1c, 1);
  g.fillCircle(23, 25, 2.6);
  g.fillCircle(45, 25, 2.6);
  // 鼻子
  g.fillStyle(0x8fd863, 1);
  g.fillEllipse(34, 38, 24, 17);
  g.lineStyle(2, 0x4e8a2f, 1);
  g.strokeEllipse(34, 38, 24, 17);
  g.fillStyle(0x3f6d26, 1);
  g.fillCircle(29, 38, 2.6);
  g.fillCircle(39, 38, 2.6);
  g.generateTexture('pig', 68, 64);
}

function drawBlockTexture(
  g: Phaser.GameObjects.Graphics,
  mat: Material,
  shape: BlockShape
): void {
  const { w, h } = BLOCK_DIMS[shape];
  const c = MAT_COLORS[mat];
  g.clear();
  const alpha = mat === 'glass' ? 0.82 : 1;
  g.fillStyle(c.fill, alpha);
  g.fillRect(2, 2, w - 4, h - 4);
  g.lineStyle(3, c.stroke, 1);
  g.strokeRect(2, 2, w - 4, h - 4);

  if (mat === 'wood') {
    g.lineStyle(2, c.detail, 0.7);
    if (w >= h) {
      g.lineBetween(6, h * 0.35, w - 6, h * 0.35);
      g.lineBetween(6, h * 0.68, w - 6, h * 0.68);
      for (let x = 66; x < w - 10; x += 66) g.lineBetween(x, 4, x, h - 4);
    } else {
      g.lineBetween(w * 0.35, 6, w * 0.35, h - 6);
      g.lineBetween(w * 0.68, 6, w * 0.68, h - 6);
      for (let y = 44; y < h - 10; y += 44) g.lineBetween(4, y, w - 4, y);
    }
  } else if (mat === 'stone') {
    g.lineStyle(2, 0xc4c8cd, 0.8);
    g.lineBetween(5, 5, w - 5, 5);
    g.fillStyle(c.detail, 0.8);
    for (let i = 0; i < Math.max(3, (w * h) / 1500); i++) {
      const x = 8 + ((i * 137) % (w - 16));
      const y = 8 + ((i * 89) % (h - 16));
      g.fillCircle(x, y, 2);
    }
  } else {
    // glass 高光
    g.lineStyle(3, c.detail, 0.55);
    const d = Math.min(w, h);
    g.lineBetween(w * 0.2, h * 0.75, w * 0.2 + d * 0.4, h * 0.75 - d * 0.4);
    g.lineBetween(w * 0.45, h * 0.85, w * 0.45 + d * 0.35, h * 0.85 - d * 0.35);
  }
  g.generateTexture(`${mat}_${shape}`, w, h);
}

function drawDebris(g: Phaser.GameObjects.Graphics, mat: Material): void {
  const c = MAT_COLORS[mat];
  g.clear();
  g.fillStyle(c.fill, 1);
  g.fillRect(0, 0, 12, 12);
  g.lineStyle(2, c.stroke, 1);
  g.strokeRect(0, 0, 12, 12);
  g.generateTexture(`debris_${mat}`, 12, 12);
}

function drawParticles(g: Phaser.GameObjects.Graphics): void {
  // 轨迹点
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(6, 6, 6);
  g.generateTexture('dot', 12, 12);
  // 火花
  g.clear();
  g.fillStyle(0xffd23e, 1);
  g.fillCircle(5, 5, 5);
  g.generateTexture('spark', 10, 10);
  // 烟雾
  g.clear();
  g.fillStyle(0xbdbdbd, 1);
  g.fillCircle(12, 12, 12);
  g.generateTexture('smoke', 24, 24);
  // 羽毛屑（红色小三角）
  g.clear();
  g.fillStyle(0xd63a2e, 1);
  g.fillTriangle(0, 0, 10, 4, 2, 10);
  g.generateTexture('feather', 10, 10);
}

function starPoints(cx: number, cy: number, outer: number, inner: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pts;
}

function drawStars(g: Phaser.GameObjects.Graphics): void {
  g.clear();
  g.fillStyle(0xffc93e, 1);
  g.fillPoints(starPoints(32, 34, 28, 12.5), true);
  g.lineStyle(3, 0xc78f14, 1);
  g.strokePoints(starPoints(32, 34, 28, 12.5), true, true);
  g.generateTexture('star_on', 64, 64);

  g.clear();
  g.fillStyle(0x9aa3ab, 1);
  g.fillPoints(starPoints(32, 34, 28, 12.5), true);
  g.lineStyle(3, 0x6d757c, 1);
  g.strokePoints(starPoints(32, 34, 28, 12.5), true, true);
  g.generateTexture('star_off', 64, 64);
}
