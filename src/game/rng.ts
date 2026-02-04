export class RNG {
  private seed: number;

  constructor(seed = Date.now() >>> 0) {
    this.seed = seed >>> 0;
  }

  // xorshift32
  nextU32(): number {
    let x = this.seed;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.seed = x >>> 0;
    return this.seed;
  }

  next01(): number {
    return this.nextU32() / 0xffffffff;
  }

  int(min: number, max: number): number {
    // inclusive min, inclusive max
    const r = this.next01();
    return min + Math.floor(r * (max - min + 1));
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }

  chance(p: number): boolean {
    return this.next01() < p;
  }
}
