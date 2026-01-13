/* eslint-disable no-console */
// 🌱 Bandage Castle demo data.
//
// Same data on every machine (fixed random seed), with dates relative to
// the day you run it so there is always someone checked in "right now".
//
// Safe to re-run: if the castle already has species, nothing happens.
// For a fresh castle: npm run db:reset
import { PrismaClient } from '@prisma/client'
import { Rng } from './random'
import { seedWorld, PASSWORD } from './world'
import { seedBillingV2Backfill, seedResidents, seedStays } from './stays'
import { seedFeedingOverrides, seedHiring, seedMedical, seedNotifications, seedRavens, seedSupplies, seedTickets } from './operations'
import { seedTherapy } from './therapy'
import { seedBulletin } from './bulletin'
import { seedAudit } from './audit'

const SEED = 20220214 // the day Gorm typed `git init`

const prisma = new PrismaClient()

async function main() {
  if ((await prisma.species.count()) > 0) {
    console.log('🌱 Seed data is already there, nothing to do. (Fresh start: npm run db:reset)')
    return
  }
  const rng = new Rng(SEED)
  const t0 = Date.now()

  console.log('🏰 Building the castle...')
  const world = await seedWorld(prisma, rng)
  console.log(`   👥 ${Object.keys(world.users).length} accounts, ${world.customers.length} customers`)
  console.log(`   📖 ${world.species.size} species, 🐉 ${world.monsters.length} monsters, 🏚️ ${world.lairs.length} lairs`)

  const stays = await seedStays(prisma, rng, world)
  await seedResidents(prisma, rng, world, stays)
  await seedFeedingOverrides(prisma, world)
  const backfilled = await seedBillingV2Backfill(prisma)
  console.log(`   🛏️ ${stays.length} stays, 💰 invoices (${backfilled} copied to Billing v2)`)

  const records = await seedMedical(prisma, rng, world, stays)
  const therapy = await seedTherapy(prisma, rng, world, stays)
  await seedTickets(prisma, rng, world)
  await seedSupplies(prisma, rng, world)
  await seedHiring(prisma, rng, world)
  await seedRavens(prisma, rng, world)
  await seedNotifications(prisma, world)
  const bulletin = await seedBulletin(prisma, world)
  await seedAudit(prisma, rng, world)
  console.log(`   🩺 ${records} medical records, 🛋️ ${therapy.plans} therapy plans (${therapy.sessions} sessions)`)
  console.log(`   🎫 tickets, 📦 supplies, 🏛️ Hiring Hall, 🐦 ravens, 📜 ${bulletin} Bulletin entries`)

  console.log(`✨ Done in ${((Date.now() - t0) / 1000).toFixed(1)}s. Log in with any account below, password "${PASSWORD}":`)
  for (const u of Object.values(world.users)) console.log(`   ${u.email.padEnd(28)} ${u.roles.join(' + ')}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
