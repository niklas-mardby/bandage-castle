// Users, customers, species, monsters and lairs.
import bcrypt from 'bcryptjs'
import type { PrismaClient, Species } from '@prisma/client'
import { COMPATIBILITY_RULES, SPECIES } from './data/species'
import { FIRST_NAMES, LAIR_KINDS, LAST_NAMES, NAMED_CUSTOMERS, PLACES, TITLES } from './data/people'
import { NAMED_MONSTERS, NAME_ENDS, NAME_STARTS, QUIRKS, TEMPERAMENTS } from './data/monsters'
import { TODAY, type Rng } from './random'

export const PASSWORD = 'castle123'

export type SeedUser = { id: number; email: string; roles: string[] }
export type SeedCustomer = { id: number; key: string | null; userId: number | null; overlord: boolean }
export type SeedMonster = {
  id: number
  key: string | null
  name: string
  species: Species
  ownerId: number | null
  birthDate: Date
}
export type SeedLair = { id: number; name: string; wing: string; capacity: number; temperatureC: number; humidity: number; darkness: number; isActive: boolean }

export type World = {
  users: Record<string, SeedUser>
  staffIds: number[]
  customers: SeedCustomer[]
  houseCustomerId: number
  customerByKey: Record<string, SeedCustomer>
  species: Map<string, Species>
  monsters: SeedMonster[]
  monsterByKey: Record<string, SeedMonster>
  lairs: SeedLair[]
}

const ACCOUNTS: { key: string; email: string; name: string; roles: string[] }[] = [
  { key: 'admin', email: 'admin@bandage.castle', name: 'Castellan Brumhilde', roles: ['ADMIN'] },
  { key: 'frontdesk', email: 'frontdesk@bandage.castle', name: 'Pip Gatewarden', roles: ['FRONT_DESK'] },
  { key: 'keeper', email: 'keeper@bandage.castle', name: 'Old Hobb', roles: ['KEEPER'] },
  { key: 'keeper2', email: 'bryony@bandage.castle', name: 'Bryony Mudlark', roles: ['KEEPER'] },
  { key: 'vet', email: 'vet@bandage.castle', name: 'Dr. Ingrid Splintmoor', roles: ['VET'] },
  { key: 'igor', email: 'igor@bandage.castle', name: 'Igor', roles: ['STAFF'] },
  { key: 'owner', email: 'owner@bandage.castle', name: 'Lady Morwenna Grimsby', roles: ['OWNER'] },
  { key: 'overlord', email: 'overlord@bandage.castle', name: 'Baron Aldric Vexmoor', roles: ['OVERLORD', 'OWNER'] },
  { key: 'grizelda', email: 'grizelda@bandage.castle', name: 'Grizelda Hexwort', roles: ['OWNER'] },
]

const CUSTOMER_FOR_ACCOUNT: Record<string, string> = { owner: 'morwenna', overlord: 'vexmoor', grizelda: 'grizelda' }

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function seedUsers(prisma: PrismaClient): Promise<Record<string, SeedUser>> {
  const passwordHash = await bcrypt.hash(PASSWORD, 10)
  const users: Record<string, SeedUser> = {}
  for (const a of ACCOUNTS) {
    // upsert: databases set up with the old 4-account seed already have some of these
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: { displayName: a.name, role: a.roles[0] },
      create: {
        email: a.email,
        displayName: a.name,
        passwordHash,
        role: a.roles[0],
        createdAt: new Date('2022-02-14T12:00:00Z'),
      },
    })
    for (const role of a.roles) {
      await prisma.userRole.upsert({ where: { userId_role: { userId: user.id, role } }, update: {}, create: { userId: user.id, role } })
    }
    users[a.key] = { id: user.id, email: a.email, roles: a.roles }
  }
  return users
}

async function seedCustomers(prisma: PrismaClient, rng: Rng, users: Record<string, SeedUser>) {
  const customers: SeedCustomer[] = []

  const house = await prisma.customer.create({
    data: {
      title: null,
      firstName: 'Bandage Castle',
      lastName: '(house account)',
      email: 'frontdesk@bandage.castle',
      contactPref: 'email',
      lairAddress: 'Bandage Castle, Cragmoor',
      notes: 'Used for stays of monsters the castle looks after itself (surrendered, waiting for hire).',
    },
  })

  for (const c of NAMED_CUSTOMERS) {
    const accountKey = Object.entries(CUSTOMER_FOR_ACCOUNT).find(([, k]) => k === c.key)?.[0]
    const userId = accountKey ? users[accountKey].id : null
    const created = await prisma.customer.create({
      data: {
        userId,
        title: c.title,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        contactPref: c.contactPref,
        lairAddress: c.lairAddress,
        notes: c.notes,
        createdAt: new Date('2022-03-01T10:00:00Z'),
      },
    })
    customers.push({ id: created.id, key: c.key, userId, overlord: c.key === 'vexmoor' || c.key === 'vexilla' })
  }

  const used = new Set<string>()
  while (customers.length < 40) {
    const first = rng.pick(FIRST_NAMES)
    const last = rng.pick(LAST_NAMES)
    if (used.has(first + last)) continue
    used.add(first + last)
    const created = await prisma.customer.create({
      data: {
        title: rng.pick(TITLES),
        firstName: first,
        lastName: last,
        email: `${first}.${last}`.toLowerCase() + '@' + rng.pick(['lair', 'doom', 'crypt', 'spire', 'hollow']) + '.example',
        contactPref: rng.weighted([['raven', 6], ['crystal ball', 2], ['email', 3]] as const),
        lairAddress: `${last} ${rng.pick(LAIR_KINDS)}, ${rng.pick(PLACES)}`,
        notes: rng.chance(0.3) ? rng.pick(['Pays in gems.', 'Always late.', 'Brings their own minions to pick up.', 'Do not mention adventurers.', 'Prefers Tuesday pickups.']) : null,
        createdAt: new Date(TODAY.getTime() - rng.int(30, 1400) * 86400000),
      },
    })
    customers.push({ id: created.id, key: null, userId: null, overlord: rng.chance(0.3) })
  }

  return { customers, houseCustomerId: house.id }
}

async function seedSpecies(prisma: PrismaClient) {
  const map = new Map<string, Species>()
  for (const [name, dangerLevel, dietType, diet, mealsPerDay, portionKg, tempMinC, tempMaxC, humidityMin, humidityMax, darkness, lifespanYears, description] of SPECIES) {
    const s = await prisma.species.create({
      data: { name, slug: slugify(name), dangerLevel, dietType, diet, mealsPerDay, portionKg, tempMinC, tempMaxC, humidityMin, humidityMax, darkness, lifespanYears, description },
    })
    map.set(name, s)
  }
  for (const [a, b, reason] of COMPATIBILITY_RULES) {
    await prisma.speciesCompatibility.create({ data: { speciesId: map.get(a)!.id, incompatibleSpeciesId: map.get(b)!.id, reason } })
  }
  return map
}

function randomBirthDate(rng: Rng, species: Species): Date {
  const maxAge = Math.min(species.lifespanYears ?? 400, 400)
  const age = rng.int(1, Math.max(2, Math.floor(maxAge * 0.7)))
  const year = TODAY.getUTCFullYear() - age
  return new Date(Date.UTC(year, rng.int(0, 11), rng.int(1, 28)))
}

async function seedMonsters(prisma: PrismaClient, rng: Rng, species: Map<string, Species>, customers: SeedCustomer[]) {
  const monsters: SeedMonster[] = []
  const byKey: Record<string, SeedMonster> = {}
  const customerByKey = Object.fromEntries(customers.filter((c) => c.key).map((c) => [c.key, c]))

  for (const m of NAMED_MONSTERS) {
    const sp = species.get(m.species)!
    const ownerId = m.owner ? customerByKey[m.owner].id : null
    const created = await prisma.monster.create({
      data: {
        name: m.name,
        speciesName: m.species,
        speciesId: sp.id,
        ownerId,
        birthDate: new Date(m.birthDate),
        temperament: m.temperament,
        quirks: m.quirks,
        history: m.history,
        status: 'HOME',
        createdAt: new Date('2022-03-15T10:00:00Z'),
      },
    })
    const seed: SeedMonster = { id: created.id, key: m.key, name: m.name, species: sp, ownerId, birthDate: new Date(m.birthDate) }
    monsters.push(seed)
    byKey[m.key] = seed
  }

  const speciesList = [...species.values()]
  const usedNames = new Set(monsters.map((m) => m.name))
  // a couple of owners have lots of monsters, most have one or two
  const ownerPool = customers.flatMap((c, i) => Array(i < 5 ? 3 : 1).fill(c.id) as number[])

  while (monsters.length < 150) {
    const name = rng.pick(NAME_STARTS) + rng.pick(NAME_ENDS)
    if (usedNames.has(name)) continue
    usedNames.add(name)
    const sp = rng.pick(speciesList)
    const ownerId = rng.chance(0.78) ? rng.pick(ownerPool) : null
    const birthDate = randomBirthDate(rng, sp)
    // the 2022 data entry was... creative
    const legacySpeciesText = rng.chance(0.08) ? rng.pick([sp.name.toLowerCase(), `${sp.name} (big)`, `${sp.name}?`]) : sp.name
    const created = await prisma.monster.create({
      data: {
        name,
        speciesName: legacySpeciesText,
        speciesId: sp.id,
        ownerId,
        birthDate,
        temperament: rng.pick(TEMPERAMENTS),
        quirks: rng.chance(0.7) ? rng.pick(QUIRKS) : null,
        history: null,
        status: 'HOME',
        createdAt: new Date(TODAY.getTime() - rng.int(10, 1450) * 86400000),
      },
    })
    monsters.push({ id: created.id, key: null, name, species: sp, ownerId, birthDate })
  }
  return { monsters, byKey }
}

const LAIRS: [string, string, number, number, number, number, string | null][] = [
  // name, wing, capacity, temperature, humidity, darkness, notes
  ['The Ember Vault', 'NORTH_TOWER', 3, 45, 20, 70, 'Fireproofed in 2022. Mind the scorch marks on the ceiling.'],
  ['The Rookery', 'NORTH_TOWER', 6, 14, 45, 20, 'Open roof hatch. Close it when it rains.'],
  ['The Draughty Attic', 'NORTH_TOWER', 5, 6, 70, 95, 'Haunted. Well, more haunted.'],
  ['Under the Old Bridge', 'DUNGEON', 4, 11, 85, 80, 'Do NOT call it a bridge in front of Mumbles.'],
  ['The Stone Garden', 'DUNGEON', 3, 26, 45, 95, 'Mirrored visors on the hook by the door. Use them.'],
  ['The Damp Cell', 'DUNGEON', 4, 9, 80, 90, null],
  ['The Web Room', 'DUNGEON', 4, 22, 65, 90, 'Compliment the webs.'],
  ['The Snug', 'EAST_WING', 6, 20, 50, 70, 'Small residents only. Count the spoons at night.'],
  ['The Quiet Room', 'EAST_WING', 4, 18, 50, 40, 'Therapy residents. Soft lighting, no sudden noises.'],
  ['The Great Hall Pen', 'EAST_WING', 8, 18, 50, 40, 'For the big ones. Low ceilings were a mistake.'],
  ['The Moat (North)', 'MOAT', 2, 9, 100, 75, 'Kraken side.'],
  ['The Moat (South)', 'MOAT', 3, 10, 100, 70, 'Serpent and hydra side. Net in the middle.'],
  ['The Perch', 'ROOFTOP', 6, 12, 60, 10, 'Gargoyles by day, everyone else by night.'],
  ['The Ooze Pit', 'CELLAR', 4, 18, 95, 70, 'Lid must stay on. LID MUST STAY ON.'],
  ['The Cold Store', 'CELLAR', 3, -12, 50, 20, 'Yeti only. Also where the ice cream lives.'],
  ['The Bone Pantry', 'CELLAR', 3, 8, 75, 95, null],
  ['The Sunny Terrace', 'EAST_WING', 4, 32, 25, 30, 'Warm and dry. Sphinxes and manticores love it.'],
  ['The Leaky Grotto', 'DUNGEON', 3, 12, 100, 80, 'Closed until the roof is fixed (ticket open since forever).'],
]

async function seedLairs(prisma: PrismaClient): Promise<SeedLair[]> {
  const lairs: SeedLair[] = []
  for (const [name, wing, capacity, temperatureC, humidity, darkness, notes] of LAIRS) {
    const isActive = name !== 'The Leaky Grotto'
    const l = await prisma.lair.create({ data: { name, wing, capacity, temperatureC, humidity, darkness, notes, isActive } })
    lairs.push({ id: l.id, name, wing, capacity, temperatureC, humidity, darkness, isActive })
  }
  return lairs
}

export async function seedWorld(prisma: PrismaClient, rng: Rng): Promise<World> {
  const users = await seedUsers(prisma)
  const { customers, houseCustomerId } = await seedCustomers(prisma, rng, users)
  const species = await seedSpecies(prisma)
  const { monsters, byKey } = await seedMonsters(prisma, rng, species, customers)
  const lairs = await seedLairs(prisma)
  return {
    users,
    staffIds: ['admin', 'frontdesk', 'keeper', 'keeper2', 'vet', 'igor'].map((k) => users[k].id),
    customers,
    houseCustomerId,
    customerByKey: Object.fromEntries(customers.filter((c) => c.key).map((c) => [c.key as string, c])),
    species,
    monsters,
    monsterByKey: byKey,
    lairs,
  }
}
