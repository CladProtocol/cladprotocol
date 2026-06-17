/**
 * Small deterministic helpers shared by the bot runtimes. The PRNG is seeded per
 * instance per minute so a fleet produces varied-but-stable activity without any
 * real randomness sneaking into tests.
 */

/** FNV-1a hash of a string → uint32 seed. */
export function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 PRNG — tiny, fast, deterministic from a uint32 seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick a random element from a non-empty array. */
export function pick<T>(rand: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)] ?? arr[0]!;
}

/** A USDC amount in [lo, hi], rounded to cents. */
export function money(rand: () => number, lo: number, hi: number): number {
  return Math.round((lo + rand() * (hi - lo)) * 100) / 100;
}

/** A short, plausible 0x…ab style hash fragment for labels (display only). */
export function stubHash(rand: () => number): string {
  const hex = "0123456789abcdef";
  const h = (n: number) =>
    Array.from({ length: n }, () => hex[Math.floor(rand() * 16)]).join("");
  return `0x${h(4)}…${h(2)}`;
}
