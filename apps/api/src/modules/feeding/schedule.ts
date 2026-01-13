// Pure functions that turn "who lives where" + species data into a feeding plan.

/** Lair-specific feeding rule (2026). Any field left null falls back to the species. */
export type FeedingOverride = {
  mealsPerDay: number | null
  portionKg: number | null
  food: string | null
  note: string | null
}

export type FeedingInput = {
  lair: { id: number; name: string; wing: string }
  monster: { id: number; name: string }
  species: { name: string; diet: string; mealsPerDay: number; portionKg: number }
  override?: FeedingOverride
}

export type FeedingEntry = {
  time: string
  lairId: number
  lairName: string
  wing: string
  monsterId: number
  monsterName: string
  species: string
  food: string
  portionKg: number
  /** shown as a ⚙️ badge so keepers know this lair has special rules */
  overrideNote?: string
}

const FIRST_MEAL = 7 // 07:00
const LAST_MEAL = 21 // 21:00

/** Meal times spread evenly over the keepers' day. */
export function mealTimes(mealsPerDay: number): string[] {
  if (mealsPerDay <= 0) return []
  if (mealsPerDay === 1) return ['12:00']
  const step = (LAST_MEAL - FIRST_MEAL) / (mealsPerDay - 1)
  return Array.from({ length: mealsPerDay }, (_, i) => {
    const hour = FIRST_MEAL + step * i
    const h = Math.floor(hour)
    const m = Math.round((hour - h) * 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  })
}

export function buildSchedule(inputs: FeedingInput[]): FeedingEntry[] {
  const entries: FeedingEntry[] = []
  for (const { lair, monster, species, override } of inputs) {
    for (const time of mealTimes(species.mealsPerDay)) {
      entries.push({
        time,
        lairId: lair.id,
        lairName: lair.name,
        wing: lair.wing,
        monsterId: monster.id,
        monsterName: monster.name,
        species: species.name,
        food: species.diet,
        portionKg: species.portionKg,
        overrideNote: override ? (override.note ?? 'lair override') : undefined,
      })
    }
  }
  // keepers walk the castle wing by wing, so sort by time, then wing, then lair
  return entries.sort((a, b) => a.time.localeCompare(b.time) || a.wing.localeCompare(b.wing) || a.lairName.localeCompare(b.lairName))
}

/** Total food per kind for the day, for the kitchen. */
export function shoppingList(entries: FeedingEntry[]): { food: string; kg: number }[] {
  const totals = new Map<string, number>()
  for (const e of entries) totals.set(e.food, (totals.get(e.food) ?? 0) + e.portionKg)
  return Array.from(totals, ([food, kg]) => ({ food, kg: Math.round(kg * 100) / 100 })).sort((a, b) => b.kg - a.kg)
}
