// localStorage 进度存档
const KEY = 'furious-birds-save-v1';

interface SaveData {
  stars: Record<number, number>; // levelId -> 0~3
  bestScore: Record<number, number>;
}

function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw) as SaveData;
      return { stars: d.stars ?? {}, bestScore: d.bestScore ?? {} };
    }
  } catch {
    /* ignore */
  }
  return { stars: {}, bestScore: {} };
}

function persist(d: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* ignore */
  }
}

export function getStars(level: number): number {
  return load().stars[level] ?? 0;
}

export function getBestScore(level: number): number {
  return load().bestScore[level] ?? 0;
}

/** 记录成绩（只保留最好成绩），返回是否刷新纪录 */
export function recordResult(level: number, stars: number, score: number): boolean {
  const d = load();
  const better = score > (d.bestScore[level] ?? 0);
  d.stars[level] = Math.max(d.stars[level] ?? 0, stars);
  if (better) d.bestScore[level] = score;
  persist(d);
  return better;
}

/** 已解锁的最大关卡号（第 1 关始终解锁；打过 n 关解锁 n+1） */
export function unlockedUpTo(totalLevels: number): number {
  const d = load();
  let n = 1;
  while (n < totalLevels && (d.stars[n] ?? 0) > 0) n++;
  return n;
}
