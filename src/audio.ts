// WebAudio 程序化合成音效（零音频文件）
// 首次用户手势后调用 unlockAudio() 以满足移动端浏览器的自动播放策略

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
const lastPlayed = new Map<string, number>();

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function unlockAudio(): void {
  const c = ensureCtx();
  if (c && c.state === 'suspended') void c.resume();
}

export function setMuted(m: boolean): void {
  muted = m;
  try {
    localStorage.setItem('furious-birds-muted', m ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function isMuted(): boolean {
  return muted;
}

export function loadMuted(): void {
  try {
    muted = localStorage.getItem('furious-birds-muted') === '1';
  } catch {
    /* ignore */
  }
}

/** 同名音效的最小触发间隔（防止碰撞音爆音墙） */
function throttled(key: string, minGapMs: number): boolean {
  const now = performance.now();
  const last = lastPlayed.get(key) ?? -Infinity;
  if (now - last < minGapMs) return true;
  lastPlayed.set(key, now);
  return false;
}

function tone(
  freqFrom: number,
  freqTo: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  delay = 0
): void {
  const c = ensureCtx();
  if (!c || !master || muted) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(
  dur: number,
  filterType: BiquadFilterType,
  freqFrom: number,
  freqTo: number,
  vol: number,
  delay = 0
): void {
  const c = ensureCtx();
  if (!c || !master || muted) return;
  const t0 = c.currentTime + delay;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(freqFrom, t0);
  filter.frequency.exponentialRampToValueAtTime(Math.max(40, freqTo), t0 + dur);
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filter).connect(gain).connect(master);
  src.start(t0);
}

export const sfx = {
  click(): void {
    tone(700, 900, 0.06, 'square', 0.12);
  },
  launch(): void {
    noise(0.3, 'bandpass', 350, 1400, 0.5);
    tone(280, 620, 0.22, 'sine', 0.15);
  },
  boost(): void {
    tone(420, 1050, 0.25, 'sawtooth', 0.2);
    noise(0.2, 'bandpass', 800, 2200, 0.3);
  },
  thud(strength = 1): void {
    if (throttled('thud', 70)) return;
    const v = Math.min(0.5, 0.16 * strength);
    tone(110, 45, 0.14, 'sine', v);
    noise(0.09, 'lowpass', 420, 120, v * 0.8);
  },
  break(mat: 'wood' | 'stone' | 'glass'): void {
    if (throttled('break_' + mat, 60)) return;
    if (mat === 'glass') {
      noise(0.22, 'highpass', 1800, 3800, 0.35);
      tone(1500, 500, 0.12, 'triangle', 0.12);
    } else if (mat === 'wood') {
      noise(0.18, 'bandpass', 500, 220, 0.4);
      tone(200, 90, 0.1, 'square', 0.1);
    } else {
      noise(0.3, 'lowpass', 500, 90, 0.5);
      tone(90, 40, 0.22, 'sine', 0.25);
    }
  },
  pigPop(): void {
    if (throttled('pig', 80)) return;
    tone(520, 90, 0.22, 'square', 0.22);
    noise(0.12, 'bandpass', 900, 300, 0.25);
  },
  boom(): void {
    noise(0.6, 'lowpass', 900, 60, 0.7);
    tone(130, 32, 0.5, 'sine', 0.5);
    noise(0.25, 'highpass', 1200, 2500, 0.2, 0.02);
  },
  stretch(): void {
    if (throttled('stretch', 90)) return;
    tone(160, 210, 0.07, 'triangle', 0.06);
  },
  star(index: number): void {
    tone(660 + index * 160, 660 + index * 160, 0.18, 'triangle', 0.2);
  },
  win(): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => tone(f, f, 0.22, 'triangle', 0.22, i * 0.14));
  },
  lose(): void {
    const notes = [392, 330, 262];
    notes.forEach((f, i) => tone(f, f * 0.97, 0.3, 'triangle', 0.2, i * 0.2));
  },
};
