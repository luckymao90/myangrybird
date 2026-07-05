// 全局配置与调参常量
export const GAME_WIDTH = 1600;
export const GAME_HEIGHT = 900;

// 地面顶部的世界 Y 坐标
export const GROUND_TOP = 800;

// Matter 重力（Phaser matter config 的 gravity.y）
export const GRAVITY_Y = 1.2;
// Matter 固定步长下每帧速度增量 ≈ 0.001 * gravity * (16.666^2)，用于轨迹预测
export const G_FRAME = 0.278 * GRAVITY_Y;

// 弹弓
export const SLING_X = 250;
export const SLING_ANCHOR = { x: SLING_X, y: 640 };
export const SLING_TIP_L = { x: SLING_X - 26, y: 652 };
export const SLING_TIP_R = { x: SLING_X + 26, y: 652 };
export const MAX_DRAG = 125; // 最大拉弓半径（像素）
export const GRAB_RADIUS = 170; // 允许开始拖拽的判定半径
export const LAUNCH_POWER = 0.175; // 拉距 -> 初速度 的系数

// 伤害模型
export const MIN_IMPACT = 5; // 低于该相对速度的碰撞不产生伤害
export const IMPACT_DMG_SCALE = 1.7;
export const MAX_EFFECTIVE_MASS = 9; // 静态物体/超重物体的等效质量上限
export const PIG_FALL_MIN_IMPACT = 3; // 猪撞静态体（地面/边界）的伤害起始阈值：比全局更低，摔落更易受伤
export const PIG_FALL_DMG_MULT = 3; // 猪撞静态体的伤害倍率：从一个箱子的高度摔落即致死

// 小鸟飞行结算
export const SETTLE_SPEED = 0.7; // 速度低于此值视为静止
export const SETTLE_TIME = 1100; // 持续静止多久后结算（ms)
export const FLIGHT_TIMEOUT = 8000; // 飞行最长时长（ms）
export const SKIP_TAP_DELAY = 1000; // 飞行多久后允许点按跳过等待（ms）

// 爆炸（黑鸟）
export const BOMB_RADIUS = 200;
export const BOMB_DAMAGE = 320;
export const BOMB_KNOCKBACK = 17;

// 分数
export const SCORE_PIG = 5000;
export const SCORE_BLOCK = 500;
export const SCORE_SPARE_BIRD = 10000;

export const FONT = '"Arial Rounded MT Bold", "Microsoft YaHei", "PingFang SC", Arial, sans-serif';
