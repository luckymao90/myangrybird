// 可摧毁积木：木/石/玻璃三种材质、五种形状
import Phaser from 'phaser';
import { BLOCK_DIMS, type BlockShape, type Material } from '../textures';

const MAT_STATS: Record<Material, { hp: number; density: number }> = {
  glass: { hp: 55, density: 0.0008 },
  wood: { hp: 130, density: 0.0012 },
  stone: { hp: 300, density: 0.0024 },
};

export class Block extends Phaser.Physics.Matter.Sprite {
  hp: number;
  readonly maxHp: number;
  readonly material: Material;
  readonly shape: BlockShape;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    material: Material,
    shape: BlockShape,
    angleDeg = 0
  ) {
    const { w, h } = BLOCK_DIMS[shape];
    super(scene.matter.world, x, y, `${material}_${shape}`, undefined, {
      shape: { type: 'rectangle', width: w, height: h },
      density: MAT_STATS[material].density,
      friction: 0.75,
      frictionStatic: 0.9,
      restitution: 0.05,
      label: 'block',
    });
    this.material = material;
    this.shape = shape;
    this.hp = MAT_STATS[material].hp;
    this.maxHp = this.hp;
    scene.add.existing(this);
    this.setDepth(8);
    if (angleDeg !== 0) this.setAngle(angleDeg);
  }

  /** 返回是否被摧毁 */
  takeDamage(dmg: number): boolean {
    this.hp -= dmg;
    const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    const v = Math.round(255 * (0.5 + 0.5 * ratio));
    this.setTint(Phaser.Display.Color.GetColor(v, v, v));
    return this.hp <= 0;
  }
}
