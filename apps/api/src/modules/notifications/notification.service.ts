import { prisma } from '../../db/prisma'
import { NotFoundError } from '../../errors/httpErrors'
import { sendRaven } from '../../legacy/ravenPost/ravenPost'

const CHANNEL_FOR_PREF: Record<string, string> = {
  raven: 'RAVEN',
  'crystal ball': 'CRYSTAL_BALL',
  email: 'EMAIL',
}

/**
 * The one place to tell someone something. 📣
 *
 * - Staff get in-app notifications (the bell in the top bar).
 * - Customers get a notification on their preferred channel. Ravens are
 *   still physically dispatched through Raven Post until it is retired.
 */
export class NotificationService {
  static async notifyUser(userId: number, title: string, body: string, link?: string) {
    return prisma.notification.create({ data: { userId, title, body, link, channel: 'IN_APP' } })
  }

  /** Notify every user holding one of `roles`, e.g. all vets. */
  static async notifyRole(roles: string[], title: string, body: string, link?: string) {
    const users = await prisma.userRole.findMany({ where: { role: { in: roles } }, select: { userId: true }, distinct: ['userId'] })
    if (users.length === 0) return 0
    const result = await prisma.notification.createMany({
      data: users.map((u) => ({ userId: u.userId, title, body, link, channel: 'IN_APP' })),
    })
    return result.count
  }

  static async notifyCustomer(customerId: number, title: string, body: string, link?: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { contactPref: true, userId: true } })
    if (!customer) throw new NotFoundError('Customer')
    const channel = CHANNEL_FOR_PREF[customer.contactPref ?? 'raven'] ?? 'RAVEN'

    const notification = await prisma.notification.create({
      // customers with a login also see it in the app
      data: { customerId, userId: customer.userId, title, body, link, channel },
    })
    if (channel === 'RAVEN') {
      // TODO: remove when Raven Post is retired (ADR-007)
      sendRaven(customerId, title, body)
    }
    return notification
  }

  static async listForUser(userId: number, opts: { unreadOnly?: boolean; take?: number } = {}) {
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId, ...(opts.unreadOnly ? { readAt: null } : {}) },
        orderBy: { createdAt: 'desc' },
        take: opts.take ?? 30,
      }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ])
    return { items, unread }
  }

  static async markRead(id: number, userId: number) {
    const n = await prisma.notification.findFirst({ where: { id, userId } })
    if (!n) throw new NotFoundError('Notification')
    return prisma.notification.update({ where: { id }, data: { readAt: n.readAt ?? new Date() } })
  }

  static async markAllRead(userId: number) {
    const result = await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } })
    return result.count
  }
}
