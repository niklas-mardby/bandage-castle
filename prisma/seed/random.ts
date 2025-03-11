// Deterministic randomness so every machine gets the same castle.
// mulberry32: tiny, fast, good enough for fake data.

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Rng {
  private next: () => number

  constructor(seed: number) {
    this.next = mulberry32(seed)
  }

  float(): number {
    return this.next()
  }

  /** integer in [min, max] */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1))
  }

  chance(p: number): boolean {
    return this.next() < p
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)]
  }

  /** pick with weights: [['A', 5], ['B', 1]] */
  weighted<T>(items: readonly (readonly [T, number])[]): T {
    const total = items.reduce((s, [, w]) => s + w, 0)
    let r = this.next() * total
    for (const [item, w] of items) {
      r -= w
      if (r <= 0) return item
    }
    return items[items.length - 1][0]
  }

  shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }
}

// --- dates relative to the day the seed runs -------------------------------

const DAY = 24 * 60 * 60 * 1000

export const TODAY = (() => {
  const d = new Date()
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
})()

/** A calendar day (UTC midnight), n days from today. Negative = past. */
export function day(n: number): Date {
  return new Date(TODAY.getTime() + n * DAY)
}

/** A moment on day n at hh:mm UTC. */
export function at(n: number, hours: number, minutes = 0): Date {
  return new Date(TODAY.getTime() + n * DAY + (hours * 60 + minutes) * 60 * 1000)
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY)
}
