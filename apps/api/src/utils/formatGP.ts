// Short form for tight spaces (raven subjects are max 255 chars): 1234567 cp -> "12.3k gp"
export function formatGP(copper: number): string {
  const gold = copper / 100
  if (gold >= 1000) return `${(gold / 1000).toFixed(1)}k gp`
  return `${gold.toFixed(2)} gp`
}
