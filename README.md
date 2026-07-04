# 怒鸟出击 (Furious Birds)

一个致敬《愤怒的小鸟》的原创 2D 物理网页游戏。所有美术由代码程序化绘制、所有音效由
WebAudio 实时合成，项目中没有任何图片/音频素材文件，无版权风险。

## 技术栈

| 层 | 选型 | 说明 |
| --- | --- | --- |
| 游戏引擎 | Phaser **3.90.0** (TypeScript) | 3.x 最终稳定版；Matter 物理 API 与 Phaser 4 一致，日后可平滑升级 |
| 物理引擎 | Phaser 内置 Matter.js | 刚体、约束、休眠、碰撞冲量，覆盖弹弓 + 可摧毁积木堆 |
| 构建 | Vite 7 + TypeScript 5 | `host: true`，手机可通过局域网直接试玩 |
| 美术 | Graphics.generateTexture 程序化生成 | 卡通风小鸟/猪/积木/背景全部代码绘制 |
| 音效 | WebAudio 合成（振荡器 + 噪声） | 首次触摸手势后自动解锁（移动端策略） |
| 存档 | localStorage | 星级与最佳成绩，通关解锁下一关 |

## 运行

```bash
npm install
npm run dev     # 本机 http://localhost:5173，手机用局域网地址（启动日志里的 Network）
npm run build   # 产物输出到 dist/
```

## 玩法

- 10 个关卡，难度递进；消灭所有绿猪即胜利，剩余小鸟越多星级越高（1~3 星）
- **红鸟**：基础弹丸；**黄鸟**：飞行中点按屏幕加速冲刺；**黑鸟**：飞行中点按屏幕爆炸
- 在弹弓附近按住拖拽瞄准（有轨迹预测虚线），松手发射；飞行 1 秒后点按可跳过等待
- 材质血量：玻璃 < 木头 < 石头，石头结构建议用黑鸟爆破
- 桌面鼠标与手机触屏均可；手机建议横屏（竖屏会有提示遮罩）

## 验证

`scripts/smoke.mjs` 与 `scripts/smoke-win.mjs` 是 Playwright（复用系统 Edge）冒烟脚本，
驱动真实浏览器完成「菜单 → 选关 → 拖弓发射 → 摧毁 → 结算 → 下一关」的截图验证：

```bash
node scripts/smoke.mjs
node scripts/smoke-win.mjs
```
