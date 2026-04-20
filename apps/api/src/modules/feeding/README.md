# 🍖 Feeding

The daily feeding schedule is generated, not stored: every monster that currently has a lair gets `mealsPerDay` meals of `portionKg` of its species' diet, spread between 07:00 and 21:00.

- `schedule.ts` — pure functions (`mealTimes`, `buildSchedule`, `shoppingList`), unit tested
- `feeding.service.ts` — loads lairs, monsters and species; marks meals as served (`feeding_logs`)
- **Overrides** (2026): a lair can override meals per day and portion size for one species or for everyone in it

Monsters without a species can't be planned; the schedule lists them under `unknownDiet`.
