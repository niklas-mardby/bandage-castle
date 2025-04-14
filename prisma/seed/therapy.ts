// Therapy plans and sessions for every therapy stay, plus Mumbles' famous file.
import type { PrismaClient } from '@prisma/client'
import { day, type Rng } from './random'
import type { SeededStay } from './stays'
import type { World } from './world'

const ISSUES: [string, string][] = [
  ['ADVENTURER_TRAUMA', 'Stop freezing when someone shouts "for glory!". Return to guarding duties part-time.'],
  ['FEAR_OF_TORCHES', 'Tolerate a lit torch at ten paces. Then five. Then one candle in the lair.'],
  ['HOARDING_ANXIETY', 'Leave the hoard unattended for one hour without checking it.'],
  ['FEAR_OF_SWORDS', 'Look at a sword (sheathed) without fainting.'],
  ['SEPARATION_ANXIETY', 'Sleep through the night without calling for the owner.'],
]

const NOTES = [
  'Talked about the incident again. Less shaking than last week.',
  'Used the breathing exercise (in through the nose, smoke out through the mouth).',
  'Brought a drawing. It was of a knight. We discussed it.',
  'Refused to talk. Sat by the window. That is fine too.',
  'Big progress: stayed calm while a keeper lit a candle.',
  'Setback after hearing a rumour about adventurers in the valley.',
  'Laughed for the first time in sessions. At a pun. A bad pun.',
  'Role-played meeting a hero. Insisted on playing the hero.',
]

const HOMEWORK = ['Look at a picture of a torch once a day', 'Write down three good things about today', 'Walk past the armoury door', 'Practise the breathing exercise', null, null]

export async function seedTherapy(prisma: PrismaClient, rng: Rng, world: World, stays: SeededStay[]) {
  const therapistId = world.users.therapist.id
  let plans = 0
  let sessions = 0

  const addPlan = async (monsterId: number, issue: string, goals: string, startDay: number, endDay: number | null, status: string, moodStart: number) => {
    const plan = await prisma.therapyPlan.create({
      data: { monsterId, therapistId, issue, goals, status, startedAt: day(startDay), endedAt: endDay === null ? null : day(endDay), createdAt: day(startDay) },
    })
    plans++
    let mood = moodStart
    const last = Math.min(endDay ?? 0, 0)
    for (let d = startDay + 1; d <= last; d += rng.int(3, 7)) {
      const before = Math.max(1, Math.min(9, mood + rng.int(-1, 1)))
      const after = Math.max(1, Math.min(10, before + rng.int(-1, 3)))
      await prisma.therapySession.create({
        data: {
          planId: plan.id,
          sessionDate: day(d),
          durationMin: rng.pick([30, 45, 50, 50, 60]),
          moodBefore: before,
          moodAfter: after,
          notes: rng.pick(NOTES),
          homework: rng.pick(HOMEWORK),
          createdAt: day(d),
        },
      })
      sessions++
      mood = Math.min(9, mood + (rng.chance(0.65) ? 1 : 0))
    }
  }

  // Mumbles: bridge trauma, slow but steady
  const mumbles = world.monsterByKey.mumbles
  await addPlan(mumbles.id, 'BRIDGE_TRAUMA', 'Say the word "bridge" out loud. Look at a picture of a bridge. One day: stand near a small bridge (a plank counts).', -20, null, 'ACTIVE', 2)
  // Nibbles: fear of torches
  await addPlan(world.monsterByKey.nibbles.id, 'FEAR_OF_TORCHES', 'Stay out of the teapot while a candle is lit in the room.', -9, null, 'ACTIVE', 2)
  // Sir Snortlewick: years of sword-related fainting
  await addPlan(world.monsterByKey.snortlewick.id, 'FEAR_OF_SWORDS', 'Remain conscious in the presence of cutlery. Then swords.', -500, -380, 'COMPLETED', 3)

  for (const s of stays.filter((x) => x.reason === 'THERAPY' && !x.monster.key && x.status !== 'BOOKED' && x.status !== 'CANCELLED')) {
    const [issue, goals] = rng.pick(ISSUES)
    const end = s.status === 'CHECKED_OUT' ? (s.checkout ?? s.start + 14) : null
    await addPlan(s.monster.id, issue, goals, s.start, end, end === null ? 'ACTIVE' : 'COMPLETED', rng.int(2, 5))
  }
  return { plans, sessions }
}
