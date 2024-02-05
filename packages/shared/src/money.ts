/**
 * Format an amount of gold pieces for display: 1234.5 -> "1,234.50 gp".
 */
export function toGoldString(gp: number | string | null | undefined): string {
  const n = Number(gp ?? 0)
  return `${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} gp`
}

// ---------------------------------------------------------------------------
// Copper (Billing v2, ADR-006). Money is an integer number of copper pieces.
// No floats, no rounding errors, no angry dragons. 🐉
// ---------------------------------------------------------------------------

/** An integer amount of copper pieces. */
export type Copper = number

export const COPPER_PER_GOLD = 100

/** 12.34 gp -> 1234 cp. Rounds to the nearest copper. */
export function toCopper(gold: number | string): Copper {
  return Math.round(Number(gold) * COPPER_PER_GOLD)
}

/** 1234 cp -> 12.34 (gold, as a number). For display maths only! */
export function fromCopper(copper: Copper): number {
  return copper / COPPER_PER_GOLD
}

/** 123456 cp -> "1,234.56 gp" */
export function formatCopper(copper: Copper): string {
  const sign = copper < 0 ? '-' : ''
  const abs = Math.abs(copper)
  const gold = Math.floor(abs / COPPER_PER_GOLD)
  const rest = abs % COPPER_PER_GOLD
  return `${sign}${gold.toLocaleString('en-GB')}.${String(rest).padStart(2, '0')} gp`
}

/** Multiply a copper amount, e.g. nights × rate, rounding once at the end. */
export function multiplyCopper(copper: Copper, factor: number): Copper {
  return Math.round(copper * factor)
}

/** Split an amount into `parts` integer pieces that add up exactly (first parts get the remainder). */
export function splitCopper(copper: Copper, parts: number): Copper[] {
  const base = Math.floor(copper / parts)
  const remainder = copper - base * parts
  return Array.from({ length: parts }, (_, i) => base + (i < remainder ? 1 : 0))
}
