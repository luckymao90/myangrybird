import Phaser from 'phaser';
import {
  BOMB_DAMAGE,
  BOMB_KNOCKBACK,
  BOMB_RADIUS,
  FLIGHT_TIMEOUT,
  FONT,
  GAME_WIDTH,
  GROUND_TOP,
  IMPACT_DMG_SCALE,
  MAX_EFFECTIVE_MASS,
  MIN_IMPACT,
  PIG_FALL_DMG_MULT,
  PIG_FALL_MIN_IMPACT,
  SCORE_BLOCK,
  SCORE_PIG,
  SCORE_SPARE_BIRD,
  SETTLE_SPEED,
  SETTLE_TIME,
  SKIP_TAP_DELAY,
  SLING_X,
} from '../config';
import { isMuted, setMuted, sfx } from '../audio';
import { LEVELS, type LevelDef } from '../levels';
import { Bird, wakeBody, type BirdType } from '../objects/Bird';
import { Block } from '../objects/Block';
import { Pig } from '../objects/Pig';
import { Slingshot } from '../objects/Slingshot';
import { getBestScore, recordResult } from '../save';
import { makeTextButton } from '../ui';

type Phase = 'aim' | 'flight' | 'won' | 'lost';

export class GameScene extends Phaser.Scene {
  private levelId = 1;
  private level!: LevelDef;
  private slingshot!: Slingshot;
  private pigs: Pig[] = [];
  private blocks: Block[] = [];
  private queue: BirdType[] = [];
  private waitingSprites: Phaser.GameObjects.Image[] = [];
  private activeBird: Bird | null = null;
  private trail: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private phase: Phase = 'aim';
  private score = 0;
  private settleMs = 0;
  private scoreText!: Phaser.GameObjects.Text;

  constructor() {
    super('Game');
  }

  init(data: { level?: number }): void {
    this.levelId = data.level ?? 1;
    this.pigs = [];
    this.blocks = [];
    this.queue = [];
    this.waitingSprites = [];
    this.activeBird = null;
    this.trail = null;
    this.phase = 'aim';
    this.score = 0;
    this.settleMs = 0;
  }

  create(): void {
    this.level = LEVELS.find((l) => l.id === this.levelId) ?? LEVELS[0];

    // 场景与物理世界
    this.add.image(0, 0, 'bg').setOrigin(0);
    this.add.image(0, GROUND_TOP, 'ground').setOrigin(0).setDepth(5);
    this.matter.add.rectangle(GAME_WIDTH / 2, GROUND_TOP + 50, GAME_WIDTH + 400, 100, {
      isStatic: true,
      friction: 0.9,
      label: 'ground',
    });
    this.matter.world.setBounds(-60, -700, GAME_WIDTH + 120, 1600 + 700, 64, true, true, false, true);

    this.add.image(SLING_X, GROUND_TOP + 6, 'sling').setOrigin(0.5, 1).setDepth(10);
    this.slingshot = new Slingshot(this, (bird) => this.onLaunch(bird));

    // 搭建关卡
    for (const b of this.level.blocks) {
      this.blocks.push(new Block(this, b.x, b.y, b.material, b.shape, b.angle ?? 0));
    }
    for (const p of this.level.pigs) {
      this.pigs.push(new Pig(this, p.x, p.y, p.hp ?? 70));
    }

    this.queue = [...this.level.birds];
    this.loadNextBird();

    // 碰撞伤害
    this.matter.world.on('collisionstart', this.onCollision, this);
    // 碰撞对分离时唤醒仍在休眠的一侧：支撑物被撞飞/滑走后，上方休眠刚体才会塌落
    this.matter.world.on(
      'collisionend',
      (event: Phaser.Physics.Matter.Events.CollisionEndEvent) => {
        for (const pair of event.pairs) {
          const a = pair.bodyA as MatterJS.BodyType;
          const b = pair.bodyB as MatterJS.BodyType;
          if (a.isSleeping && !b.isSleeping && !b.isStatic) wakeBody(a);
          else if (b.isSleeping && !a.isSleeping && !a.isStatic) wakeBody(b);
        }
      }
    );

    // 输入
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.phase === 'aim') {
        this.slingshot.tryStartDrag(p);
      } else if (this.phase === 'flight') {
        this.onFlightTap();
      }
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.slingshot.drag(p));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.slingshot.release(p));

    this.buildHud();

    // 仅开发模式：暴露场景引用，供自动化冒烟测试驱动
    if (import.meta.env.DEV) {
      (window as unknown as { __game?: GameScene }).__game = this;
    }
  }

  private buildHud(): void {
    this.add
      .text(30, 26, `第 ${this.level.id} 关 · ${this.level.name}`, {
        fontFamily: FONT,
        fontSize: '34px',
        color: '#ffffff',
        stroke: '#2c5b78',
        strokeThickness: 6,
      })
      .setDepth(50);
    this.scoreText = this.add
      .text(30, 74, '得分 0', {
        fontFamily: FONT,
        fontSize: '30px',
        color: '#fff3c0',
        stroke: '#7a5b00',
        strokeThickness: 5,
      })
      .setDepth(50);

    const mkIcon = (x: number, label: string, cb: () => void): void => {
      makeTextButton(this, x, 62, 78, 66, label, cb, {
        fill: 0x4a90b8,
        fillDown: 0x3a769a,
        fontSize: 32,
      }).setDepth(50);
    };
    mkIcon(GAME_WIDTH - 60, '✕', () => this.scene.start('LevelSelect'));
    mkIcon(GAME_WIDTH - 150, '↻', () => this.scene.restart({ level: this.levelId }));
    mkIcon(GAME_WIDTH - 240, isMuted() ? '♪✕' : '♪', () => {
      setMuted(!isMuted());
      this.scene.restart({ level: this.levelId });
    });
  }

  // ---------------- 小鸟流程 ----------------

  private loadNextBird(): void {
    const type = this.queue.shift();
    this.refreshWaitingRow();
    if (!type) return;
    const bird = new Bird(this, SLING_X - 95, GROUND_TOP - 30, type);
    this.slingshot.load(bird);
  }

  private refreshWaitingRow(): void {
    for (const s of this.waitingSprites) s.destroy();
    this.waitingSprites = [];
    this.queue.forEach((t, i) => {
      this.waitingSprites.push(
        this.add
          .image(SLING_X - 160 - i * 58, GROUND_TOP - 24, `bird_${t}`)
          .setScale(0.78)
          .setDepth(6)
      );
    });
  }

  private onLaunch(bird: Bird): void {
    this.activeBird = bird;
    this.phase = 'flight';
    this.settleMs = 0;
    this.trail = this.add.particles(0, 0, 'smoke', {
      follow: bird,
      scale: { start: 0.45, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 380,
      frequency: 45,
    });
    this.trail.setDepth(6);
  }

  private onFlightTap(): void {
    const bird = this.activeBird;
    if (!bird || bird.birdState !== 'flying') return;

    if (bird.birdType === 'yellow' && !bird.abilityUsed) {
      if (bird.boost()) {
        sfx.boost();
        this.add
          .particles(0, 0, 'spark', {
            follow: bird,
            speed: { min: 60, max: 160 },
            scale: { start: 0.9, end: 0 },
            lifespan: 300,
            frequency: 18,
            duration: 350,
          })
          .setDepth(6);
      }
      return;
    }
    if (bird.birdType === 'black' && !bird.abilityUsed) {
      bird.abilityUsed = true;
      this.explode(bird.x, bird.y);
      this.finishActiveBird(true);
      return;
    }
    // 无能力/能力已用：飞行一段时间后允许点按跳过等待
    if (this.time.now - bird.launchedAt > SKIP_TAP_DELAY) {
      this.finishActiveBird();
    }
  }

  private finishActiveBird(consumed = false): void {
    const bird = this.activeBird;
    if (!bird) return;
    this.activeBird = null;
    bird.birdState = 'done';
    if (this.trail) {
      this.trail.stop();
      const t = this.trail;
      this.time.delayedCall(500, () => t.destroy());
      this.trail = null;
    }
    if (consumed) {
      bird.destroy();
    } else {
      this.add.particles(bird.x, bird.y, 'feather', {
        speed: { min: 40, max: 140 },
        lifespan: 500,
        scale: { start: 1, end: 0 },
      }).setDepth(6).explode(8, bird.x, bird.y);
      this.tweens.add({
        targets: bird,
        alpha: 0,
        scale: 0.6,
        duration: 260,
        onComplete: () => bird.destroy(),
      });
    }
    this.time.delayedCall(500, () => this.afterBirdDone());
  }

  private afterBirdDone(): void {
    if (this.phase !== 'flight') return;
    if (this.pigs.length === 0) return; // 胜利流程已由 checkWin 触发
    if (this.queue.length === 0) {
      this.showLose();
    } else {
      this.phase = 'aim';
      this.loadNextBird();
    }
  }

  update(_time: number, delta: number): void {
    if (this.phase !== 'flight' || !this.activeBird) return;
    const bird = this.activeBird;
    const out = bird.y > GROUND_TOP + 160 || bird.x < -70 || bird.x > GAME_WIDTH + 70;
    if (out) {
      this.finishActiveBird(true);
      return;
    }
    if (bird.speed < SETTLE_SPEED) {
      this.settleMs += delta;
    } else {
      this.settleMs = 0;
    }
    if (this.settleMs > SETTLE_TIME || this.time.now - bird.launchedAt > FLIGHT_TIMEOUT) {
      this.finishActiveBird();
    }
  }

  // ---------------- 碰撞与伤害 ----------------

  private onCollision(event: Phaser.Physics.Matter.Events.CollisionStartEvent): void {
    for (const pair of event.pairs) {
      const a = pair.bodyA as MatterJS.BodyType;
      const b = pair.bodyB as MatterJS.BodyType;
      const impact = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
      // 用各类目标中最低的起伤阈值做粗筛，具体阈值在 damageFrom 里按目标类型结算
      if (impact <= PIG_FALL_MIN_IMPACT) continue;
      if (impact > 7.5) sfx.thud(impact / 14);
      this.damageFrom(a, b, impact);
      this.damageFrom(b, a, impact);
    }
  }

  /** source body 撞击 target body，对 target 侧的实体结算伤害 */
  private damageFrom(source: MatterJS.BodyType, target: MatterJS.BodyType, impact: number): void {
    const go = (target as { gameObject?: unknown }).gameObject;
    if (!(go instanceof Pig) && !(go instanceof Block)) return;
    const srcMass = source.isStatic ? 6 : Math.min(source.mass, MAX_EFFECTIVE_MASS);
    const birdBonus = (source as { gameObject?: unknown }).gameObject instanceof Bird ? 1.35 : 1;
    // 猪皮薄：摔在地面等静态体上用更低阈值+额外倍率（从一个箱子的高度摔落即致死）
    const pigFall = go instanceof Pig && source.isStatic;
    const minImpact = pigFall ? PIG_FALL_MIN_IMPACT : MIN_IMPACT;
    const mult = pigFall ? PIG_FALL_DMG_MULT : 1;
    const dmg = (impact - minImpact) * srcMass * IMPACT_DMG_SCALE * birdBonus * mult;
    if (dmg <= 0) return;
    this.applyDamage(go, dmg);
  }

  private applyDamage(target: Pig | Block, dmg: number): void {
    if (!target.active || target.hp <= 0) return;
    const dead = target.takeDamage(dmg);
    if (!dead) return;
    if (target instanceof Pig) this.killPig(target);
    else this.destroyBlock(target);
  }

  /** 移除刚体不会唤醒靠它支撑的休眠刚体（Matter 无此机制），摧毁后手动全体唤醒让上方结构塌落 */
  private wakeAllStructures(): void {
    for (const t of [...this.blocks, ...this.pigs]) {
      wakeBody(t.body as MatterJS.BodyType | null);
    }
  }

  private killPig(pig: Pig): void {
    this.pigs = this.pigs.filter((p) => p !== pig);
    sfx.pigPop();
    this.addScore(SCORE_PIG, pig.x, pig.y);
    this.add
      .particles(pig.x, pig.y, 'smoke', {
        speed: { min: 50, max: 160 },
        scale: { start: 1, end: 0 },
        lifespan: 420,
        tint: 0x9fe07c,
      })
      .setDepth(20)
      .explode(14, pig.x, pig.y);
    pig.destroy();
    this.wakeAllStructures();
    this.checkWin();
  }

  private destroyBlock(block: Block): void {
    this.blocks = this.blocks.filter((bl) => bl !== block);
    sfx.break(block.material);
    this.addScore(SCORE_BLOCK, block.x, block.y);
    this.add
      .particles(block.x, block.y, `debris_${block.material}`, {
        speed: { min: 60, max: 220 },
        scale: { start: 1, end: 0.2 },
        rotate: { min: 0, max: 360 },
        lifespan: 550,
        gravityY: 600,
      })
      .setDepth(20)
      .explode(10, block.x, block.y);
    block.destroy();
    this.wakeAllStructures();
  }

  private explode(x: number, y: number): void {
    sfx.boom();
    this.cameras.main.shake(220, 0.011);
    const flash = this.add.circle(x, y, 30, 0xfff1c0, 0.95).setDepth(30);
    this.tweens.add({
      targets: flash,
      scale: BOMB_RADIUS / 30,
      alpha: 0,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });
    this.add
      .particles(x, y, 'spark', {
        speed: { min: 120, max: 420 },
        scale: { start: 1.3, end: 0 },
        lifespan: 480,
      })
      .setDepth(30)
      .explode(26, x, y);
    this.add
      .particles(x, y, 'smoke', {
        speed: { min: 60, max: 200 },
        scale: { start: 1.6, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 700,
      })
      .setDepth(29)
      .explode(16, x, y);

    const targets: Array<Pig | Block> = [...this.pigs, ...this.blocks];
    for (const t of targets) {
      const d = Phaser.Math.Distance.Between(x, y, t.x, t.y);
      if (d > BOMB_RADIUS) continue;
      const falloff = 1 - d / BOMB_RADIUS;
      const body = t.body as MatterJS.BodyType | null;
      if (body) {
        wakeBody(body);
        const nx = (t.x - x) / Math.max(d, 1);
        const ny = (t.y - y) / Math.max(d, 1);
        t.setVelocity(
          body.velocity.x + nx * BOMB_KNOCKBACK * falloff,
          body.velocity.y + ny * BOMB_KNOCKBACK * falloff - 2.5 * falloff
        );
      }
      this.applyDamage(t, BOMB_DAMAGE * falloff);
    }
  }

  // ---------------- 计分与胜负 ----------------

  private addScore(v: number, x?: number, y?: number): void {
    this.score += v;
    this.scoreText.setText(`得分 ${this.score}`);
    if (x !== undefined && y !== undefined) {
      const t = this.add
        .text(x, y - 30, `+${v}`, {
          fontFamily: FONT,
          fontSize: '30px',
          color: '#ffffff',
          stroke: '#c2571a',
          strokeThickness: 5,
        })
        .setOrigin(0.5)
        .setDepth(40);
      this.tweens.add({
        targets: t,
        y: y - 100,
        alpha: 0,
        duration: 800,
        ease: 'Quad.easeOut',
        onComplete: () => t.destroy(),
      });
    }
  }

  private checkWin(): void {
    if (this.pigs.length > 0 || this.phase === 'won' || this.phase === 'lost') return;
    this.phase = 'won';
    const spare = this.queue.length + (this.slingshot.loadedBird ? 1 : 0);
    const stars = Math.min(3, 1 + spare);
    this.addScore(spare * SCORE_SPARE_BIRD);
    this.time.delayedCall(800, () => this.showWin(stars));
  }

  private makeOverlayBase(): void {
    this.add
      .rectangle(GAME_WIDTH / 2, 450, GAME_WIDTH, 900, 0x0c2233, 0.55)
      .setDepth(90)
      .setInteractive(); // 挡住下层输入
    const g = this.add.graphics().setDepth(91);
    g.fillStyle(0xfff7e8, 0.98);
    g.fillRoundedRect(GAME_WIDTH / 2 - 330, 180, 660, 520, 26);
    g.lineStyle(6, 0xf2820a, 1);
    g.strokeRoundedRect(GAME_WIDTH / 2 - 330, 180, 660, 520, 26);
  }

  private showWin(stars: number): void {
    sfx.win();
    recordResult(this.levelId, stars, this.score);
    this.makeOverlayBase();
    const cx = GAME_WIDTH / 2;
    this.add
      .text(cx, 255, '胜 利 !', {
        fontFamily: FONT,
        fontSize: '68px',
        color: '#2f9e44',
        stroke: '#ffffff',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(92);

    for (let i = 0; i < 3; i++) {
      const star = this.add
        .image(cx - 110 + i * 110, 380, i < stars ? 'star_on' : 'star_off')
        .setDepth(92)
        .setScale(0);
      this.tweens.add({
        targets: star,
        scale: 1.35,
        delay: 250 + i * 260,
        duration: 320,
        ease: 'Back.easeOut',
        onStart: () => {
          if (i < stars) sfx.star(i);
        },
      });
    }

    const best = getBestScore(this.levelId);
    this.add
      .text(cx, 480, `得分 ${this.score}   最佳 ${Math.max(best, this.score)}`, {
        fontFamily: FONT,
        fontSize: '32px',
        color: '#6b4b12',
      })
      .setOrigin(0.5)
      .setDepth(92);

    const hasNext = this.levelId < LEVELS.length;
    makeTextButton(this, cx - 180, 610, 160, 76, '重玩', () =>
      this.scene.restart({ level: this.levelId })
    ).setDepth(92);
    makeTextButton(
      this,
      cx,
      610,
      160,
      76,
      hasNext ? '下一关' : '选关',
      () =>
        hasNext
          ? this.scene.restart({ level: this.levelId + 1 })
          : this.scene.start('LevelSelect'),
      { fill: 0x37a24a, fillDown: 0x2b833b }
    ).setDepth(92);
    makeTextButton(this, cx + 180, 610, 160, 76, '选关', () =>
      this.scene.start('LevelSelect')
    ).setDepth(92);
  }

  private showLose(): void {
    if (this.phase === 'won' || this.phase === 'lost') return;
    this.phase = 'lost';
    sfx.lose();
    this.makeOverlayBase();
    const cx = GAME_WIDTH / 2;
    this.add
      .text(cx, 280, '差一点！', {
        fontFamily: FONT,
        fontSize: '64px',
        color: '#d9480f',
        stroke: '#ffffff',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(92);
    this.add
      .image(cx, 420, 'pig')
      .setDepth(92)
      .setScale(1.6);
    this.add
      .text(cx, 510, '小猪还在嘲笑你，再试一次吧', {
        fontFamily: FONT,
        fontSize: '30px',
        color: '#6b4b12',
      })
      .setOrigin(0.5)
      .setDepth(92);

    makeTextButton(this, cx - 100, 615, 170, 76, '重玩', () =>
      this.scene.restart({ level: this.levelId })
    ).setDepth(92);
    makeTextButton(this, cx + 100, 615, 170, 76, '选关', () =>
      this.scene.start('LevelSelect')
    ).setDepth(92);
  }
}
