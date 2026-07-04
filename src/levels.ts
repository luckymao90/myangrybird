// 10 个关卡的数据定义（用组装函数保证结构对齐、堆叠稳定）
import { GROUND_TOP } from './config';
import type { BirdType } from './objects/Bird';
import { BLOCK_DIMS, type BlockShape, type Material } from './textures';

export interface BlockDef {
  x: number;
  y: number;
  material: Material;
  shape: BlockShape;
  angle?: number;
}

export interface PigDef {
  x: number;
  y: number;
  hp?: number;
}

export interface LevelDef {
  id: number;
  name: string;
  birds: BirdType[];
  blocks: BlockDef[];
  pigs: PigDef[];
}

const G = GROUND_TOP;
const PIG_R = 30;

/** 地面上的猪 */
function pigOnGround(x: number, hp?: number): PigDef {
  return { x, y: G - PIG_R, hp };
}

/** 站在某个"表面高度"上的猪（surfaceY 为其脚下表面的 y） */
function pigOn(x: number, surfaceY: number, hp?: number): PigDef {
  return { x, y: surfaceY - PIG_R, hp };
}

function block(x: number, y: number, material: Material, shape: BlockShape, angle?: number): BlockDef {
  return { x, y, material, shape, angle };
}

/** 在 surfaceY 表面上放一个积木，返回 [积木, 新表面高度] */
function on(surfaceY: number, x: number, material: Material, shape: BlockShape): { def: BlockDef; top: number } {
  const h = BLOCK_DIMS[shape].h;
  return { def: block(x, surfaceY - h / 2, material, shape), top: surfaceY - h };
}

/**
 * 单层小屋：两根柱子 + 一块横板，可在屋顶继续叠。
 * 返回屋顶表面 y。
 */
function hut(
  out: BlockDef[],
  x: number,
  baseY: number,
  colMat: Material,
  roofMat: Material,
  span = 140
): number {
  const colH = BLOCK_DIMS.column.h;
  const roofH = BLOCK_DIMS.plank.h;
  out.push(block(x - span / 2, baseY - colH / 2, colMat, 'column'));
  out.push(block(x + span / 2, baseY - colH / 2, colMat, 'column'));
  out.push(block(x, baseY - colH - roofH / 2, roofMat, 'plank'));
  return baseY - colH - roofH;
}

/** 箱子竖塔，返回塔顶表面 y */
function boxTower(out: BlockDef[], x: number, baseY: number, mats: Material[]): number {
  let y = baseY;
  for (const m of mats) {
    const r = on(y, x, m, 'box');
    out.push(r.def);
    y = r.top;
  }
  return y;
}

/** 金字塔（rows 层小箱子），返回塔顶表面 y */
function pyramid(out: BlockDef[], x: number, baseY: number, mat: Material, rows: number): number {
  const s = BLOCK_DIMS.small.w + 2;
  let y = baseY;
  for (let r = rows; r >= 1; r--) {
    const width = (r - 1) * s;
    for (let i = 0; i < r; i++) {
      out.push(block(x - width / 2 + i * s, y - BLOCK_DIMS.small.h / 2, mat, 'small'));
    }
    y -= BLOCK_DIMS.small.h;
  }
  return y;
}

function buildLevels(): LevelDef[] {
  const levels: LevelDef[] = [];

  // ---------- 第 1 关：新手教学 ----------
  {
    const blocks: BlockDef[] = [];
    const t1 = boxTower(blocks, 1250, G, ['glass']);
    levels.push({
      id: 1,
      name: '初试身手',
      birds: ['red', 'red', 'red'],
      blocks,
      pigs: [pigOnGround(1020), pigOn(1250, t1)],
    });
  }

  // ---------- 第 2 关：玻璃小屋 ----------
  {
    const blocks: BlockDef[] = [];
    const roof = hut(blocks, 1150, G, 'glass', 'glass');
    levels.push({
      id: 2,
      name: '玻璃小屋',
      birds: ['red', 'red', 'red'],
      blocks,
      pigs: [pigOnGround(1150), pigOn(1150, roof), pigOnGround(1400)],
    });
  }

  // ---------- 第 3 关：黄鸟登场（远处目标） ----------
  {
    const blocks: BlockDef[] = [];
    const roof = hut(blocks, 1420, G, 'wood', 'wood');
    const t = boxTower(blocks, 1100, G, ['glass', 'glass']);
    levels.push({
      id: 3,
      name: '风驰电掣',
      birds: ['red', 'yellow', 'yellow'],
      blocks,
      pigs: [pigOn(1100, t), pigOnGround(1420), pigOn(1420, roof)],
    });
  }

  // ---------- 第 4 关：金字塔 ----------
  {
    const blocks: BlockDef[] = [];
    const top = pyramid(blocks, 1200, G, 'glass', 4);
    const roof = hut(blocks, 950, G, 'wood', 'glass');
    levels.push({
      id: 4,
      name: '层层设防',
      birds: ['red', 'red', 'yellow'],
      blocks,
      pigs: [pigOn(1200, top, 60), pigOnGround(950), pigOn(950, roof)],
    });
  }

  // ---------- 第 5 关：双子屋 ----------
  {
    const blocks: BlockDef[] = [];
    const r1 = hut(blocks, 1000, G, 'wood', 'wood');
    const r2 = hut(blocks, 1350, G, 'wood', 'wood');
    const r1b = hut(blocks, 1000, r1, 'glass', 'wood');
    levels.push({
      id: 5,
      name: '双子小楼',
      birds: ['yellow', 'red', 'yellow'],
      blocks,
      pigs: [pigOnGround(1000), pigOn(1000, r1b), pigOnGround(1350), pigOn(1350, r2)],
    });
  }

  // ---------- 第 6 关：黑鸟登场（石头碉堡） ----------
  {
    const blocks: BlockDef[] = [];
    const roof = hut(blocks, 1200, G, 'stone', 'stone');
    blocks.push(block(1200 - 35, G - BLOCK_DIMS.small.h / 2, 'stone', 'small'));
    blocks.push(block(1200 + 35, G - BLOCK_DIMS.small.h / 2, 'stone', 'small'));
    levels.push({
      id: 6,
      name: '重装碉堡',
      birds: ['red', 'black', 'black'],
      blocks,
      pigs: [pigOn(1200, G - BLOCK_DIMS.small.h, 90), pigOn(1200, roof)],
    });
  }

  // ---------- 第 7 关：高塔 ----------
  {
    const blocks: BlockDef[] = [];
    const t1 = boxTower(blocks, 1080, G, ['wood', 'glass', 'wood']);
    const t2 = boxTower(blocks, 1400, G, ['stone', 'wood']);
    levels.push({
      id: 7,
      name: '摇摇欲坠',
      birds: ['red', 'yellow', 'black'],
      blocks,
      pigs: [pigOn(1080, t1), pigOn(1400, t2), pigOnGround(1240, 80)],
    });
  }

  // ---------- 第 8 关：石桥城堡 ----------
  {
    const blocks: BlockDef[] = [];
    const rL = hut(blocks, 1000, G, 'stone', 'wood');
    const rR = hut(blocks, 1380, G, 'stone', 'wood');
    // 两屋之间架桥
    blocks.push(block(1190, G - BLOCK_DIMS.column.h - BLOCK_DIMS.plank.h - BLOCK_DIMS.beam.h / 2, 'wood', 'beam'));
    const rL2 = hut(blocks, 1000, rL, 'glass', 'glass');
    levels.push({
      id: 8,
      name: '石桥要塞',
      birds: ['black', 'yellow', 'red', 'red'],
      blocks,
      pigs: [pigOnGround(1000), pigOn(1000, rL2), pigOnGround(1380), pigOn(1380, rR)],
    });
  }

  // ---------- 第 9 关：混合堡垒 ----------
  {
    const blocks: BlockDef[] = [];
    const roof1 = hut(blocks, 1150, G, 'stone', 'stone', 160);
    const roof2 = hut(blocks, 1150, roof1, 'wood', 'wood', 120);
    const top = pyramid(blocks, 1440, G, 'stone', 3);
    levels.push({
      id: 9,
      name: '铜墙铁壁',
      birds: ['yellow', 'black', 'red', 'black'],
      blocks,
      pigs: [pigOnGround(1150, 90), pigOn(1150, roof2), pigOn(1440, top, 60)],
    });
  }

  // ---------- 第 10 关：终极城堡 ----------
  {
    const blocks: BlockDef[] = [];
    const rL = hut(blocks, 980, G, 'stone', 'stone');
    const rR = hut(blocks, 1420, G, 'stone', 'stone');
    const rL2 = hut(blocks, 980, rL, 'wood', 'wood');
    const rR2 = hut(blocks, 1420, rR, 'wood', 'wood');
    const tMid = boxTower(blocks, 1200, G, ['stone', 'stone']);
    levels.push({
      id: 10,
      name: '猪王城堡',
      birds: ['red', 'yellow', 'black', 'black'],
      blocks,
      pigs: [
        pigOnGround(980),
        pigOn(980, rL2),
        pigOn(1200, tMid, 110),
        pigOnGround(1420),
        pigOn(1420, rR2),
      ],
    });
  }

  return levels;
}

export const LEVELS: LevelDef[] = buildLevels();
