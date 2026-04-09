export const mulberry32 = (seed: number) => {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const randomInt = (rng: () => number, min: number, max: number) =>
  Math.floor(rng() * (max - min + 1)) + min;

export const randomItem = <T>(items: T[], rng: () => number): T =>
  items[Math.floor(rng() * items.length)];

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
