export type RNG = () => number;

export function mulberry32(seed: number): RNG {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(rng: RNG, min: number, max: number): number {
  // inclusive min, inclusive max
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pickOne<T>(rng: RNG, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function pickMany<T>(rng: RNG, items: T[], count: number): T[] {
  if (count <= 0) return [];
  const copy = items.slice();
  const result: T[] = [];
  for (let i = 0; i < count && copy.length > 0; i++) {
    const idx = Math.floor(rng() * copy.length);
    result.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return result;
}