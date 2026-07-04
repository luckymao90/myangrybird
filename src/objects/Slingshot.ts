// 弹弓：拖拽装填、轨迹预测、皮筋渲染、发射
import Phaser from 'phaser';
import {
  G_FRAME,
  GRAB_RADIUS,
  LAUNCH_POWER,
  MAX_DRAG,
  SLING_ANCHOR,
  SLING_TIP_L,
  SLING_TIP_R,
} from '../config';
import { sfx } from '../audio';
import type { Bird } from './Bird';

const TRAJECTORY_DOTS = 13;

export class Slingshot {
  private scene: Phaser.Scene;
  private bandBack: Phaser.GameObjects.Graphics;
  private bandFront: Phaser.GameObjects.Graphics;
  private dots: Phaser.GameObjects.Image[] = [];
  private bird: Bird | null = null;
  private dragging = false;
  private dragPointerId = -1;
  private onLaunch: (bird: Bird) => void;

  constructor(scene: Phaser.Scene, onLaunch: (bird: Bird) => void) {
    this.scene = scene;
    this.onLaunch = onLaunch;
    this.bandBack = scene.add.graphics().setDepth(11);
    this.bandFront = scene.add.graphics().setDepth(13);
    for (let i = 0; i < TRAJECTORY_DOTS; i++) {
      const dot = scene.add
        .image(0, 0, 'dot')
        .setDepth(7)
        .setAlpha(0)
        .setScale(1 - (i / TRAJECTORY_DOTS) * 0.55);
      this.dots.push(dot);
    }
  }

  get isDragging(): boolean {
    return this.dragging;
  }

  get loadedBird(): Bird | null {
    return this.bird;
  }

  /** 把小鸟装上弹弓（带一个小飞行动画） */
  load(bird: Bird): void {
    this.bird = bird;
    bird.birdState = 'loaded';
    this.scene.tweens.add({
      targets: bird,
      x: SLING_ANCHOR.x,
      y: SLING_ANCHOR.y,
      duration: 220,
      ease: 'Quad.easeOut',
      onComplete: () => this.drawBands(),
    });
  }

  tryStartDrag(pointer: Phaser.Input.Pointer): boolean {
    if (!this.bird || this.bird.birdState !== 'loaded' || this.dragging) return false;
    const d = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, SLING_ANCHOR.x, SLING_ANCHOR.y);
    if (d > GRAB_RADIUS) return false;
    this.dragging = true;
    this.dragPointerId = pointer.id;
    this.drag(pointer);
    return true;
  }

  drag(pointer: Phaser.Input.Pointer): void {
    if (!this.dragging || !this.bird || pointer.id !== this.dragPointerId) return;
    const dx = pointer.worldX - SLING_ANCHOR.x;
    const dy = pointer.worldY - SLING_ANCHOR.y;
    const len = Math.hypot(dx, dy);
    const clamped = Math.min(len, MAX_DRAG);
    if (len > 8) sfx.stretch();
    const nx = len > 0 ? dx / len : 0;
    const ny = len > 0 ? dy / len : 0;
    const x = SLING_ANCHOR.x + nx * clamped;
    const y = SLING_ANCHOR.y + ny * clamped;
    this.bird.setPosition(x, y);
    this.drawBands();
    this.drawTrajectory(x, y);
  }

  /** 松手：拉距足够则发射，否则弹回 */
  release(pointer: Phaser.Input.Pointer): void {
    if (!this.dragging || !this.bird || pointer.id !== this.dragPointerId) return;
    this.dragging = false;
    this.dragPointerId = -1;
    const bird = this.bird;
    const dx = SLING_ANCHOR.x - bird.x;
    const dy = SLING_ANCHOR.y - bird.y;
    const dist = Math.hypot(dx, dy);
    this.hideTrajectory();

    if (dist < 18) {
      // 拉距太小，弹回原位
      this.scene.tweens.add({
        targets: bird,
        x: SLING_ANCHOR.x,
        y: SLING_ANCHOR.y,
        duration: 150,
        ease: 'Back.easeOut',
        onComplete: () => this.drawBands(),
      });
      return;
    }

    this.bird = null;
    bird.launch(dx * LAUNCH_POWER, dy * LAUNCH_POWER);
    sfx.launch();
    this.drawBands();
    this.onLaunch(bird);
  }

  private drawBands(): void {
    this.bandBack.clear();
    this.bandFront.clear();
    if (!this.bird || this.bird.birdState !== 'loaded') return;
    const bx = this.bird.x;
    const by = this.bird.y + 6;
    this.bandBack.lineStyle(9, 0x4a2f1d, 1);
    this.bandBack.lineBetween(SLING_TIP_R.x, SLING_TIP_R.y, bx, by);
    this.bandFront.lineStyle(9, 0x5e3c24, 1);
    this.bandFront.lineBetween(SLING_TIP_L.x, SLING_TIP_L.y, bx, by);
  }

  private drawTrajectory(x: number, y: number): void {
    const vx = (SLING_ANCHOR.x - x) * LAUNCH_POWER;
    const vy = (SLING_ANCHOR.y - y) * LAUNCH_POWER;
    // 与 Matter 固定步长一致的显式积分预览
    let px = x;
    let py = y;
    let cvx = vx;
    let cvy = vy;
    const stepsPerDot = 5;
    for (let i = 0; i < this.dots.length; i++) {
      for (let s = 0; s < stepsPerDot; s++) {
        px += cvx;
        py += cvy;
        cvy += G_FRAME;
        cvx *= 0.994;
        cvy *= 0.994;
      }
      this.dots[i].setPosition(px, py).setAlpha(0.85 - (i / this.dots.length) * 0.6);
    }
  }

  private hideTrajectory(): void {
    for (const d of this.dots) d.setAlpha(0);
  }

  destroy(): void {
    this.bandBack.destroy();
    this.bandFront.destroy();
    for (const d of this.dots) d.destroy();
  }
}
