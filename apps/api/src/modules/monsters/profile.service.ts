// The full staff view of one monster: everything we know, from every module.
// (Owners still use the classic /api/monsters/:id.)
import { ageInYears } from '@bandage/shared'
import { prisma } from '../../db/prisma'
import { NotFoundError } from '../../errors/httpErrors'

export async function monsterProfile(id: number) {
  const monster = await prisma.monster.findUnique({
    where: { id },
    include: {
      species: true,
      owner: { select: { id: true, title: true, firstName: true, lastName: true, contactPref: true } },
      stays: { orderBy: { startDate: 'desc' }, select: { id: true, reason: true, status: true, startDate: true, expectedPickup: true, checkedOutAt: true } },
      lairAssignments: { orderBy: { assignedAt: 'desc' }, include: { lair: { select: { id: true, name: true, wing: true } } } },
      medicalRecords: {
        orderBy: { visitDate: 'desc' },
        include: { treatments: true, prescriptions: true },
      },
      therapyPlans: { orderBy: { startedAt: 'desc' }, select: { id: true, issue: true, status: true, startedAt: true, endedAt: true, _count: { select: { sessions: true } } } },
      hiringListings: { orderBy: { createdAt: 'desc' }, select: { id: true, title: true, status: true, availableFrom: true, feeGold: true } },
    },
  })
  if (!monster) throw new NotFoundError('Monster')

  const [intakes, contracts, tickets] = await Promise.all([
    prisma.intakeForm.findMany({ where: { monsterId: id }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.hireContract.findMany({ where: { monsterId: id }, select: { id: true, reference: true, signedAt: true, fee: true, customerId: true } }),
    // tickets don't link to monsters, but keepers mention them by name
    prisma.ticket.findMany({
      where: { OR: [{ title: { contains: monster.name } }, { description: { contains: monster.name } }] },
      select: { id: true, title: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  const currentLair = monster.lairAssignments.find((a) => a.releasedAt === null)?.lair ?? null
  const ongoingTreatments = monster.medicalRecords.flatMap((r) => r.treatments).filter((t) => t.status === 'ONGOING')
  const weights = intakes.filter((i) => i.weightKg !== null).map((i) => ({ date: i.createdAt, kg: Number(i.weightKg) }))

  return {
    id: monster.id,
    name: monster.name,
    status: monster.status,
    birthDate: monster.birthDate,
    age: ageInYears(monster.birthDate),
    temperament: monster.temperament,
    quirks: monster.quirks,
    history: monster.history,
    legacySpeciesText: monster.speciesName,
    species: monster.species ? { ...monster.species, portionKg: Number(monster.species.portionKg) } : null,
    owner: monster.owner,
    currentLair,
    lairHistory: monster.lairAssignments.map((a) => ({ id: a.id, lair: a.lair, assignedAt: a.assignedAt, releasedAt: a.releasedAt })),
    stays: monster.stays,
    medical: {
      records: monster.medicalRecords.length,
      ongoingTreatments: ongoingTreatments.map((t) => t.name),
      lastVisit: monster.medicalRecords[0]?.visitDate ?? null,
      prescriptions: monster.medicalRecords.flatMap((r) => r.prescriptions).slice(0, 10),
    },
    // only counts and dates; session notes stay with the therapists
    therapy: monster.therapyPlans.map((p) => ({ id: p.id, issue: p.issue, status: p.status, startedAt: p.startedAt, endedAt: p.endedAt, sessions: p._count.sessions })),
    hiring: { listings: monster.hiringListings.map((l) => ({ ...l, feeGold: Number(l.feeGold) })), contracts },
    weights,
    tickets,
  }
}
