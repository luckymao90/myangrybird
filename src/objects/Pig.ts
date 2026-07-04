// 绿猪：被撞击/砸中扣血，血尽即被消灭
import Phaser from 'phaser';

export class Pig extends Phaser.Physics.Matter.Sprite {
  hp: number;
  readonly maxHp: number;

  constructor(scene: Phaser.Scene, x: number, y: number, hp = 70) {
    super(scene.matter.world, x, y, 'pig', undefined, {
      shape: { type: 'circle', radius: 28 },
      density: 0.0012,
      friction: 0.6,
      restitution: 0.2,
      label: 'pig',
    });
    this.hp = hp;
    this.maxHp = hp;
    scene.add.existing(this);
    this.setDepth(9);
  }

  /** 返回是否死亡 */
  takeDamage(dmg: number): boolean {
    this.hp -= dmg;
    const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    const v = Math.round(255 * (0.55 + 0.45 * ratio));
    this.setTint(Phaser.Display.Color.GetColor(v, 255, v));
    return this.hp <= 0;
  }
}
