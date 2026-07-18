/**
 * Deterministic, seedable pseudo-random source.
 *
 * Determinism is a hard requirement: the same seed must reproduce the same
 * run bit-for-bit so scenarios and regression tests are stable. We use a small
 * splitmix64-seeded mulberry32 generator — no external dependency, no reliance
 * on Math.random().
 */
export class Rng {
  private state: number;

  constructor(seed: number) {
    // Mix the seed so nearby seeds (0, 1, 2) produce well-separated streams.
    let z = (seed >>> 0) + 0x9e3779b9;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
    this.state = (z ^ (z >>> 15)) >>> 0;
  }

  /** Uniform in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Uniform in [min, max). */
  uniform(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  /** Standard normal via Box–Muller (deterministic given the stream). */
  gaussian(mean = 0, stddev = 1): number {
    // Guard against log(0).
    const u1 = Math.max(this.next(), Number.MIN_VALUE);
    const u2 = this.next();
    const mag = Math.sqrt(-2.0 * Math.log(u1));
    return mean + stddev * mag * Math.cos(2 * Math.PI * u2);
  }

  /** Fork an independent, still-deterministic sub-stream. */
  fork(salt: number): Rng {
    return new Rng((this.state ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0);
  }
}
