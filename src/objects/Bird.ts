// 三种小鸟：红(基础)、黄(点按加速)、黑(点按爆炸)
import Phaser from 'phaser';

export type BirdType = 'red' | 'yellow' | 'black';

const BIRD_STATS: Record<BirdType, { radius: number; density: number }> = {
  red: { radius: 26, density: 0.004 },
  yellow: { radius: 24, density: 0.0035 },
  black: { radius: 27, density: 0.005 },
};

export type BirdState = 'waiting' | 'loaded' | 'flying' | 'done';

/** 唤醒休眠中的 Matter 刚体（等价于 MatterLib Sleeping.set(body, false)） */
export function wakeBody(body: MatterJS.BodyType | null): void {
  if (!body) return;
  body.isSleeping = false;
  (body as unknown as { sleepCounter: number }).sleepCounter = 0;
}

export class Bird extends Phaser.Physics.Matter.Sprite {
  readonly birdType: BirdType;
  birdState: BirdState = 'waiting';
  abilityUsed = false;
  launchedAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, type: BirdType) {
    super(scene.matter.world, x, y, `bird_${type}`, undefined, {
      shape: { type: 'circle', radius: BIRD_STATS[type].radius },
      density: BIRD_STATS[type].density,
      friction: 0.9,
      frictionAir: 0.006,
      restitution: 0.35,
      label: 'bird',
    });
    this.birdType = type;
    scene.add.existing(this);
    this.setStatic(true);
    this.setDepth(12);
  }

  launch(vx: number, vy: number): void {
    this.setStatic(false);
    // 唤醒休眠刚体，否则 setVelocity 对睡眠中的身体无效（鸟会凝固在原地）
    wakeBody(this.body as MatterJS.BodyType);
    this.setVelocity(vx, vy);
    this.setAngularVelocity(vx >= 0 ? 0.08 : -0.08);
    this.birdState = 'flying';
    this.launchedAt = this.scene.time.now;
  }

  get speed(): number {
    const body = this.body as MatterJS.BodyType | null;
    if (!body) return 0;
    return Math.hypot(body.velocity.x, body.velocity.y);
  }

  /** 黄鸟能力：沿当前方向加速。返回是否触发成功 */
  boost(): boolean {
    if (this.birdType !== 'yellow' || this.abilityUsed || this.birdState !== 'flying') return false;
    this.abilityUsed = true;
    const body = this.body as MatterJS.BodyType;
    this.setVelocity(body.velocity.x * 1.75, body.velocity.y * 1.6);
    return true;
  }
}
