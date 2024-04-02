import { prisma } from '../../db/prisma'
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../errors/httpErrors'
import { sendRaven } from '../../legacy/ravenPost/ravenPost'
import { contractReference, STANDARD_TERMS } from './reference'
import { NotificationService } from '../notifications/notification.service'

export type ApplyInput = {
  message: string
  lairDescription?: string
  references: { refereeName: string; relationship: string; text: string }[]
}

const include = {
  listing: { include: { monster: { select: { id: true, name: true } } } },
  references: true,
}

export async function apply(listingId: number, customerId: number | null, input: ApplyInput) {
  if (!customerId) throw new BadRequestError('Your account has no customer profile. Ask the front desk to set one up.')

  const listing = await prisma.hiringListing.findUnique({ where: { id: listingId } })
  if (!listing || listing.status !== 'OPEN') throw new NotFoundError('Listing')

  const existing = await prisma.hiringApplication.findFirst({ where: { listingId, customerId, status: 'PENDING' } })
  if (existing) throw new ConflictError('You already applied for this monster')

  const application = await prisma.hiringApplication.create({
    data: {
      listingId,
      customerId,
      message: input.message,
      lairDescription: input.lairDescription,
      references: { create: input.references },
    },
    include,
  })
  await NotificationService.notifyRole(
    ['FRONT_DESK', 'ADMIN'],
    `New application for ${application.listing.monster.name}`,
    'An overlord wants to hire one of our monsters.',
    '/hiring/applications',
  )
  return application
}

export async function listApplications(opts: { customerId?: number; status?: string }) {
  const apps = await prisma.hiringApplication.findMany({
    where: { customerId: opts.customerId, status: opts.status },
    include,
    orderBy: { createdAt: 'desc' },
  })
  // customer names for the staff view (no relation in prisma for tbl_customer yet)
  const customers = await prisma.customer.findMany({
    where: { id: { in: [...new Set(apps.map((a) => a.customerId))] } },
    select: { id: true, title: true, firstName: true, lastName: true },
  })
  return apps.map((a) => ({ ...a, customer: customers.find((c) => c.id === a.customerId) ?? null }))
}

export async function withdraw(id: number, customerId: number | null) {
  const app = await prisma.hiringApplication.findUnique({ where: { id } })
  if (!app) throw new NotFoundError('Application')
  if (app.customerId !== customerId) throw new ForbiddenError()
  if (app.status !== 'PENDING') throw new BadRequestError('Only pending applications can be withdrawn')
  return prisma.hiringApplication.update({ where: { id }, data: { status: 'WITHDRAWN' } })
}

export async function decide(id: number, decision: 'ACCEPTED' | 'REJECTED', staffId: number) {
  const app = await prisma.hiringApplication.findUnique({ where: { id }, include })
  if (!app) throw new NotFoundError('Application')
  if (app.status !== 'PENDING') throw new BadRequestError('Already decided')

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.hiringApplication.update({
      where: { id },
      data: { status: decision, decidedAt: new Date(), decidedById: staffId },
    })
    if (decision === 'ACCEPTED') {
      // first come first served: everyone else waiting for this monster is told no
      await tx.hiringApplication.updateMany({
        where: { listingId: app.listingId, status: 'PENDING', id: { not: id } },
        data: { status: 'REJECTED', decidedAt: new Date(), decidedById: staffId },
      })
      // the contract is drafted straight away; the overlord signs it from "My contracts"
      await tx.hireContract.create({
        data: {
          applicationId: id,
          monsterId: app.listing.monsterId,
          customerId: app.customerId,
          reference: contractReference(),
          fee: Number(app.listing.feeGold),
          startDate: app.listing.availableFrom > new Date() ? app.listing.availableFrom : new Date(),
          terms: STANDARD_TERMS,
        },
      })
    }
    return result
  })

  const monsterName = app.listing.monster.name
  sendRaven(
    app.customerId,
    decision === 'ACCEPTED' ? `Good news about ${monsterName}!` : `About your application for ${monsterName}`,
    decision === 'ACCEPTED'
      ? `Your application to hire ${monsterName} has been accepted. A contract is waiting for your signature (in blood or ink, your choice).`
      : `We're sorry, ${monsterName} will be going to another lair.`,
  )

  return updated
}
