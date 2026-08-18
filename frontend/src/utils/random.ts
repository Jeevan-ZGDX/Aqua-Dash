export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(...parts: (string | number)[]): number {
  const str = parts.join('::');
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickRandom<T>(rand: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

export function weightedRandom(rand: () => number, weights: Record<string, number>): string {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = rand() * total;
  for (const [key, w] of entries) {
    roll -= w;
    if (roll <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

export function shuffle<T>(rand: () => number, arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function normal(rand: () => number, mean: number, sd: number): number {
  const u = Math.max(rand(), 1e-9);
  const v = Math.max(rand(), 1e-9);
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
