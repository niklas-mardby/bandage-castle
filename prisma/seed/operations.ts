// Day-to-day castle life: medical records, tickets, supplies, the Hiring Hall, ravens.
import type { PrismaClient } from '@prisma/client'
import { at, day, type Rng } from './random'
import type { SeededStay } from './stays'
import type { World } from './world'

const DIAGNOSES: [string, string, string[]][] = [
  ['Arrow wound, left wing', 'Shallow puncture through the wing membrane. No infection.', ['Wing splint', 'Clean and dress daily']],
  ['Singed tail', 'Second-degree burn, self-inflicted during a sneeze.', ['Cooling salve', 'No fire-breathing for a week']],
  ['Sprained claw', 'Overextended during a dramatic exit through a window.', ['Claw brace', 'Rest']],
  ['Sore throat from roaring', 'Laryngitis. Too many intimidating roars at adventurers.', ['Honey tincture', 'Voice rest']],
  ['Head-on-head bite', 'One head bit another. Classic hydra problem.', ['Stitches', 'Separate feeding bowls']],
  ['Chipped horn', 'Hairline crack after headbutting a portcullis.', ['Horn resin', 'Padding on the portcullis']],
  ['Sword nick on the snout', 'Minor cut from an overconfident squire.', ['Antiseptic salve']],
  ['Moulting', 'Seasonal. Loses scales everywhere. Keepers unimpressed.', ['Scale oil', 'Extra vacuuming']],
  ['Indigestion', 'Ate a knight\'s helmet. With the knight\'s lunch inside.', ['Stomach-soothing potion', 'Bland diet']],
  ['Torch burn', 'Adventurer waved a torch too close.', ['Burn salve', 'Therapy referral']],
]

const REMEDIES: [string, string, string, string][] = [
  ['Dragonbalm', 'SALVE', 'one large scoop', 'twice daily'],
  ['Essence of Willow', 'TINCTURE', '10 drops', 'morning and evening'],
  ['Restorative Draught', 'POTION', '1 flask', 'once daily with food'],
  ['Mandrake Poultice', 'POULTICE', 'one wrap', 'change every 12 hours'],
  ['Elixir of Calm', 'ELIXIR', '2 spoons', 'before bed'],
  ['Goblin-Grade Antiseptic', 'SALVE', 'thin layer', 'three times daily'],
]

export async function seedMedical(prisma: PrismaClient, rng: Rng, world: World, stays: SeededStay[]) {
  const vetId = world.users.vet.id
  let count = 0
  for (const s of stays.filter((x) => x.reason === 'TREATMENT' && (x.status === 'CHECKED_IN' || x.status === 'CHECKED_OUT'))) {
    // Pebble only arrived yesterday and the vet hasn't seen her yet.
    if (s.monster.key === 'pebble' && s.status === 'CHECKED_IN') continue
    const visits = rng.int(1, 2)
    for (let v = 0; v < visits; v++) {
      const [summary, diagnosis, treatments] = s.monster.key === 'hester' && s.status === 'CHECKED_IN' ? DIAGNOSES[4] : s.monster.key === 'bramble' ? (['Lost flight feathers', 'Stress moult after her knight retired. Regrowing slowly.', ['Feather regrowth tonic']] as [string, string, string[]]) : rng.pick(DIAGNOSES)
      const visitDay = s.start + v * 2
      const current = s.status === 'CHECKED_IN'
      await prisma.medicalRecord.create({
        data: {
          monsterId: s.monster.id,
          vetId,
          visitDate: day(Math.min(visitDay, 0)),
          summary: v === 0 ? summary : `Follow-up: ${summary.toLowerCase()}`,
          diagnosis: v === 0 ? diagnosis : rng.pick(['Healing nicely.', 'Slower than hoped.', 'Patient keeps picking at the bandage.']),
          notes: rng.chance(0.3) ? rng.pick(['Bit the vet. Affectionately.', 'Very brave.', 'Owner phoned five times.', 'Needs a bigger cone.']) : null,
          createdAt: at(Math.min(visitDay, 0), 11),
          treatments: {
            create: treatments.map((name) => ({
              name,
              status: current ? 'ONGOING' : 'COMPLETE',
              startedAt: day(Math.min(visitDay, 0)),
              endedAt: current ? null : day(s.checkout ?? s.start + 3),
            })),
          },
          prescriptions: rng.chance(0.6)
            ? {
                create: [rng.pick(REMEDIES)].map(([remedy, form, dosage, frequency]) => ({
                  remedy,
                  form,
                  dosage,
                  frequency,
                  startDate: day(Math.min(visitDay, 0)),
                  endDate: current ? day(rng.int(2, 10)) : day((s.checkout ?? s.start) - 1),
                })),
              }
            : undefined,
        },
      })
      count++
    }
  }
  // a couple of routine check-ups for long-term residents
  for (const key of ['whisper', 'grumbold', 'basil']) {
    const m = world.monsterByKey[key]
    await prisma.medicalRecord.create({
      data: { monsterId: m.id, vetId, visitDate: day(-rng.int(20, 200)), summary: 'Annual check-up', diagnosis: 'Healthy. Mostly.', createdAt: at(-30, 10) },
    })
    count++
  }
  return count
}

const TICKETS: [string, string, string, string][] = [
  // title, category, priority, description
  ['Portcullis stuck half open again', 'MAINTENANCE', 'HIGH', 'The chain jumped the gear. Monsters can walk under it, visitors can\'t.'],
  ['Slime escaped from the Ooze Pit', 'ESCAPE', 'URGENT', 'Last seen heading for the kitchen. Lid was left off.'],
  ['Clean the Ember Vault', 'CLEANING', 'MEDIUM', 'Soot everywhere. Bring the long brushes.'],
  ['Moat net has a hole', 'MAINTENANCE', 'HIGH', 'Kraken side and serpent side are no longer separate. Please hurry.'],
  ['Order more goat', 'SUPPLIES', 'MEDIUM', 'Dragon season. We are going through goat faster than expected.'],
  ['Spider web blocking the east stairs', 'CLEANING', 'LOW', 'It is very beautiful. Madame Fangsworth says so. It is still in the way.'],
  ['Gargoyle fell off the Perch', 'ESCAPE', 'HIGH', 'Found in the courtyard pretending to be a statue.'],
  ['Leaky Grotto roof', 'MAINTENANCE', 'MEDIUM', 'Still leaking. Lair closed until fixed.'],
  ['Replace torches in the Quiet Room with candles', 'MAINTENANCE', 'LOW', 'Therapy residents are afraid of torchlight.'],
  ['Imp stuck in the chimney', 'ESCAPE', 'MEDIUM', 'Again.'],
  ['Restock mirrored visors', 'SUPPLIES', 'HIGH', 'Only two left at the Stone Garden door.'],
  ['Mop the Damp Cell', 'CLEANING', 'LOW', 'It is called the Damp Cell for a reason, but this is too much.'],
  ['Drawbridge squeaks', 'MAINTENANCE', 'LOW', 'Wakes the banshee, who wakes everyone else.'],
  ['Werewolf moon calendar is out of date', 'OTHER', 'MEDIUM', 'Need next year\'s calendar before the 1st.'],
  ['Hydra head count mismatch', 'OTHER', 'HIGH', 'Check-in sheet says 5, keeper counted 6. Recount.'],
  ['Cold Store door does not close', 'MAINTENANCE', 'URGENT', 'Yeti is fine. Ice cream is not.'],
]

export async function seedTickets(prisma: PrismaClient, rng: Rng, world: World) {
  const staff = world.staffIds
  const assignees = [world.users.keeper.id, world.users.keeper2.id, world.users.igor.id, world.users.frontdesk.id, world.users.vet.id]
  const lairs = world.lairs
  const comments = ['On it.', 'Needs parts from the blacksmith.', 'Fixed, I think?', 'Happened again.', 'Who left the lid off??', 'Done. Please don\'t do this again.', 'Escalating to the Castellan.', 'Bribed the imp with sugar. Worked.']

  for (let i = 0; i < 60; i++) {
    const [title, category, priority, description] = rng.pick(TICKETS)
    const createdDay = -Math.floor(((60 - i) / 60) * 1000) + rng.int(-5, 5)
    const age = -createdDay
    const status = age > 60 ? rng.weighted([['DONE', 90], ['BLOCKED', 5], ['OPEN', 5]] as const) : rng.weighted([['OPEN', 40], ['IN_PROGRESS', 30], ['BLOCKED', 10], ['DONE', 20]] as const)
    const createdAt = at(createdDay, rng.int(7, 20), rng.int(0, 59))
    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        category,
        priority,
        status,
        assigneeId: rng.chance(0.85) ? rng.pick(assignees) : null,
        reporterId: rng.pick(staff),
        lairId: rng.chance(0.4) ? rng.pick(lairs).id : null,
        dueDate: rng.chance(0.4) ? day(createdDay + rng.int(1, 14)) : null,
        createdAt,
        closedAt: status === 'DONE' ? at(createdDay + rng.int(0, 10), 16) : null,
      },
    })
    const n = rng.int(0, 4)
    for (let c = 0; c < n; c++) {
      await prisma.ticketComment.create({
        data: { ticketId: ticket.id, authorId: rng.pick(staff), body: rng.pick(comments), createdAt: new Date(createdAt.getTime() + (c + 1) * 3600_000 * rng.int(1, 30)) },
      })
    }
  }
}

const SUPPLIES: [string, string, string, number, number, string | null][] = [
  // name, category, unit, quantity, threshold, supplier
  ['Goat (whole)', 'FOOD', 'goats', 34, 20, 'Hillside Goat Co.'],
  ['Turnips', 'FOOD', 'kg', 120, 50, 'Muddy Fields Farm'],
  ['Herring', 'FOOD', 'barrels', 6, 8, 'Saltmire Fishmongers'],
  ['Tuna (whole)', 'FOOD', 'fish', 12, 6, 'Saltmire Fishmongers'],
  ['Crickets', 'FOOD', 'buckets', 9, 5, 'The Chirping Barn'],
  ['Hay', 'FOOD', 'bales', 40, 15, 'Muddy Fields Farm'],
  ['Frozen berries', 'FOOD', 'kg', 18, 10, null],
  ['Stew (pre-made)', 'FOOD', 'cauldrons', 4, 3, 'Castle kitchen'],
  ['Sugar cubes (imp grade)', 'FOOD', 'kg', 3, 2, null],
  ['Mutton', 'FOOD', 'kg', 75, 40, 'Hillside Goat Co.'],
  ['Rats (live)', 'FOOD', 'crates', 2, 4, 'Ask Igor'],
  ['Dragon-grade burn salve', 'POTION', 'jars', 6, 6, 'The Apothecary of Bleakwater'],
  ['Restorative Draught', 'POTION', 'flasks', 22, 10, 'The Apothecary of Bleakwater'],
  ['Elixir of Calm', 'POTION', 'flasks', 9, 5, 'Therapy supplies'],
  ['Feather regrowth tonic', 'POTION', 'bottles', 3, 2, null],
  ['Honey tincture', 'POTION', 'bottles', 14, 6, null],
  ['Bandages (standard)', 'BANDAGE', 'rolls', 140, 60, 'Splint & Sons'],
  ['Bandages (wing size)', 'BANDAGE', 'rolls', 18, 20, 'Splint & Sons'],
  ['Bandages (tentacle)', 'BANDAGE', 'rolls', 7, 5, 'Splint & Sons'],
  ['Splints (claw)', 'BANDAGE', 'pieces', 25, 10, 'Splint & Sons'],
  ['Cones of shame (XL)', 'BANDAGE', 'pieces', 4, 2, null],
  ['Straw bedding', 'BEDDING', 'bales', 60, 25, 'Muddy Fields Farm'],
  ['Fireproof blankets', 'BEDDING', 'pieces', 8, 4, null],
  ['Moss (damp)', 'BEDDING', 'sacks', 11, 6, null],
  ['Mirrored visors', 'OTHER', 'pieces', 2, 4, 'Glassworks of Cragmoor'],
  ['Earmuffs (banshee)', 'OTHER', 'pairs', 12, 6, null],
  ['Riddle books', 'OTHER', 'books', 5, 2, 'Sphinx Supplies Ltd.'],
  ['Moon calendars', 'OTHER', 'calendars', 1, 1, null],
  ['Mops', 'CLEANING', 'mops', 7, 4, null],
  ['Soot brushes', 'CLEANING', 'brushes', 10, 4, null],
  ['Slime solvent', 'CLEANING', 'bottles', 5, 3, null],
  ['Web dissolver', 'CLEANING', 'bottles', 0, 2, null],
  ['Scale oil', 'POTION', 'bottles', 13, 5, null],
  ['Horn resin', 'POTION', 'tubes', 6, 3, null],
  ['Candles (therapy)', 'OTHER', 'boxes', 9, 4, null],
  ['Goblin-proof spoon locks', 'OTHER', 'pieces', 15, 5, null],
  ['Lichen', 'FOOD', 'kg', 8, 5, null],
  ['Clay (golem polish)', 'OTHER', 'kg', 20, 8, null],
  ['Pickled onions', 'FOOD', 'jars', 30, 10, null],
  ['Mushrooms', 'FOOD', 'kg', 5, 5, 'The Dark Cellar Co.'],
]

export async function seedSupplies(prisma: PrismaClient, rng: Rng, world: World) {
  for (const [name, category, unit, quantity, lowStockThreshold, supplier] of SUPPLIES) {
    const s = await prisma.supply.create({ data: { name, category, unit, quantity, lowStockThreshold, supplier } })
    const moves = rng.int(0, 3)
    for (let i = 0; i < moves; i++) {
      const delivery = rng.chance(0.4)
      await prisma.supplyMovement.create({
        data: {
          supplyId: s.id,
          change: delivery ? rng.int(5, 30) : -rng.int(1, 5),
          reason: delivery ? 'DELIVERY' : rng.pick(['USED', 'USED', 'SPOILED']),
          userId: rng.pick([world.users.keeper.id, world.users.keeper2.id, world.users.vet.id]),
          createdAt: at(-rng.int(1, 60), 9),
        },
      })
    }
  }
}

const PITCHES = [
  'Experienced hoard guardian seeks a damp cave with a view. Excellent references from three former overlords.',
  'Loyal, well-rested and fully patched up. Intimidating roar, gentle with minions.',
  'Fresh from a long holiday at Bandage Castle. Ready to terrify adventurers again (Mondays to Thursdays).',
  'Quiet, tidy, guards treasure without counting it out loud. Mostly.',
  'Looking for a forever-lair. Good with stairs, bad with sunlight.',
]

const SKILLS = ['treasure guarding', 'intimidating roars', 'riddles', 'night patrol', 'moat duty', 'menacing silhouettes', 'trap maintenance', 'minion wrangling', 'flying', 'petrifying stares']

export async function seedHiring(prisma: PrismaClient, rng: Rng, world: World) {
  const monsters = await prisma.monster.findMany({ where: { ownerId: null }, include: { species: true } })
  const overlords = world.customers.filter((c) => c.overlord)
  const admin = world.users.admin.id
  const frontDesk = world.users.frontdesk.id

  const ref = () => {
    const A = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

    let s = ''
    for (let i = 0; i < 4; i++) s += A[rng.int(0, A.length - 1)]
    return `HH-${s}`
  }
  const usedRefs = new Set<string>()

  for (const m of monsters) {
    if (m.status !== 'AVAILABLE' && m.status !== 'HIRED' && m.name !== 'Bramble') continue
    const hired = m.status === 'HIRED'
    const soon = m.name === 'Bramble'
    const availableFrom = soon ? day(10) : day(-rng.int(5, 600))
    const listing = await prisma.hiringListing.create({
      data: {
        monsterId: m.id,
        title: `${m.name} the ${m.species?.name ?? 'monster'}: ${rng.pick(['seeks new lair', 'available for hire', 'ready for adventure(rs)', 'looking for an overlord'])}`,
        pitch: rng.pick(PITCHES),
        skills: rng.shuffle(SKILLS).slice(0, rng.int(1, 3)).join(','),
        availableFrom,
        feeGold: rng.pick([150, 250, 400, 650, 1200, 2500]),
        status: hired ? 'CLOSED' : 'OPEN',
        createdById: rng.pick([admin, frontDesk]),
        createdAt: new Date(availableFrom.getTime() - 14 * 86400000),
      },
    })

    const applicants = rng.shuffle(overlords).slice(0, hired ? rng.int(1, 3) : rng.int(0, 2))
    for (let i = 0; i < applicants.length; i++) {
      const accepted = hired && i === 0
      const app = await prisma.hiringApplication.create({
        data: {
          listingId: listing.id,
          customerId: applicants[i].id,
          message: rng.pick([
            'My dungeon has been unguarded since my last troll retired. Excellent conditions, dental plan.',
            'I have a lovely damp cave and only moderate adventurer traffic.',
            'Seeking a guardian for my treasury. Must not eat the treasure.',
            'My tower needs a menacing presence on the battlements. Flexible hours.',
          ]),
          lairDescription: rng.chance(0.6) ? rng.pick(['Large cave, 14 °C, very damp.', 'Tower top, windy, great views.', 'Underground vault, pitch black.']) : null,
          status: hired ? (accepted ? 'ACCEPTED' : 'REJECTED') : 'PENDING',
          createdAt: new Date(listing.createdAt.getTime() + (i + 1) * 3 * 86400000),
          decidedAt: hired ? new Date(listing.createdAt.getTime() + 20 * 86400000) : null,
          decidedById: hired ? frontDesk : null,
          references: rng.chance(0.6)
            ? { create: [{ refereeName: rng.pick(['Grub the Minion', 'A Former Hero (retired)', 'The Witch of Saltmire']), relationship: rng.pick(['former minion', 'neighbour', 'nemesis']), text: 'Treats monsters well. Pays on time. Laughs maniacally only on weekends.' }] }
            : undefined,
        },
      })
      if (accepted) {
        let r = ref()
        while (usedRefs.has(r)) r = ref()
        usedRefs.add(r)
        await prisma.hireContract.create({
          data: {
            applicationId: app.id,
            monsterId: m.id,
            customerId: applicants[i].id,
            reference: r,
            fee: Number(listing.feeGold),
            startDate: new Date(listing.createdAt.getTime() + 25 * 86400000),
            terms: 'Standard terms (see hiring/reference.ts).',
            signedAt: new Date(listing.createdAt.getTime() + 22 * 86400000),
          },
        })
      }
    }
  }
}

export async function seedRavens(prisma: PrismaClient, rng: Rng, world: World) {
  const subjects = ['has arrived safely at Bandage Castle', 'has been checked out. Safe travels!', 'Your invoice is ready', 'A friendly reminder about your invoice']
  for (let i = 0; i < 120; i++) {
    const c = rng.pick(world.customers)
    const created = at(-rng.int(1, 1400), rng.int(8, 20))
    await prisma.raven.create({
      data: { customerId: c.id, subject: rng.pick(subjects), body: 'Greetings from Bandage Castle!', status: 'SENT', createdAt: created, sentAt: new Date(created.getTime() + 15000) },
    })
  }
}

export async function seedNotifications(prisma: PrismaClient, world: World) {
  const n = (userId: number, title: string, body: string, link: string | null, daysAgo: number, read = false) =>
    prisma.notification.create({ data: { userId, title, body, link, channel: 'IN_APP', createdAt: at(-daysAgo, 9), readAt: read ? at(-daysAgo, 10) : null } })
  await n(world.users.frontdesk.id, 'New application for Grumbold', 'An overlord wants to hire one of our monsters.', '/hiring/applications', 2)
  await n(world.users.frontdesk.id, 'Gloopert arrives in 3 days', 'Booked boarding stay. Prepare the Ooze Pit lid.', null, 0)
  await n(world.users.vet.id, 'Pebble admitted for treatment', 'Chipped wing. Not seen by a vet yet.', '/vet', 1)
  await n(world.users.keeper.id, 'Clucky needs a lair', 'Surrendered cockatrice has no lair yet.', '/lairs', 2)
  await n(world.users.admin.id, 'Welcome to the new notification bell', 'Staff notifications now appear here. 🔔', null, 200, true)
}

export async function seedFeedingOverrides(prisma: PrismaClient, world: World) {
  const ember = world.lairs.find((l) => l.name === 'The Ember Vault')!
  const moat = world.lairs.find((l) => l.name === 'The Moat (South)')!
  const hydra = world.species.get('Hydra')!
  await prisma.lairFeedingOverride.create({
    data: { lairId: ember.id, speciesId: world.species.get('Dragon')!.id, mealsPerDay: 3, portionKg: 50, note: 'Winter: dragons get a third meal (vet\'s orders)', createdById: world.users.keeper.id },
  })
  await prisma.lairFeedingOverride.create({
    data: { lairId: moat.id, speciesId: hydra.id, mealsPerDay: 5, portionKg: 3, note: 'One small meal per head, otherwise they fight', createdById: world.users.vet.id },
  })
}
