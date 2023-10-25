/* eslint-disable no-console */
// Minimal seed: one account per role so you can log in. Safe to re-run.
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PASSWORD = 'castle123'

const ACCOUNTS: { email: string; name: string; roles: string[] }[] = [
  { email: 'admin@bandage.castle', name: 'Castellan Brumhilde', roles: ['ADMIN'] },
  { email: 'frontdesk@bandage.castle', name: 'Pip Gatewarden', roles: ['FRONT_DESK'] },
  { email: 'keeper@bandage.castle', name: 'Old Hobb', roles: ['KEEPER'] },
  { email: 'vet@bandage.castle', name: 'Dr. Ingrid Splintmoor', roles: ['VET'] },
]

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10)
  for (const a of ACCOUNTS) {
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: { email: a.email, displayName: a.name, passwordHash, role: a.roles[0] },
    })
    for (const role of a.roles) {
      await prisma.userRole.upsert({
        where: { userId_role: { userId: user.id, role } },
        update: {},
        create: { userId: user.id, role },
      })
    }
  }
  console.log(`🌱 Seeded ${ACCOUNTS.length} accounts (password: ${PASSWORD})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
