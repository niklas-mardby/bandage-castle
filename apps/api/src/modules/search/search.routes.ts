// One search box for the whole castle (staff only).
import { Router } from 'express'
import { STAFF_ROLES, hasRole } from '@bandage/shared'
import { prisma } from '../../db/prisma'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole } from '../../middleware/requireRole'

export const searchRouter = Router()

const LIMIT = 6

export type SearchHit = { type: 'monster' | 'customer' | 'species' | 'ticket' | 'bulletin' | 'lair'; id: number; title: string; subtitle: string | null; url: string }

searchRouter.get(
  '/',
  requireRole(...STAFF_ROLES),
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    if (q.length < 2) return res.json([])

    const canSeeCustomers = hasRole(req.user, 'ADMIN', 'FRONT_DESK')
    const [monsters, customers, species, tickets, pages, lairs] = await Promise.all([
      prisma.monster.findMany({ where: { name: { contains: q } }, select: { id: true, name: true, status: true, species: { select: { name: true } } }, take: LIMIT }),
      canSeeCustomers
        ? prisma.customer.findMany({
            where: { OR: [{ lastName: { contains: q } }, { firstName: { contains: q } }, { email: { contains: q } }] },
            select: { id: true, title: true, firstName: true, lastName: true, email: true },
            take: LIMIT,
          })
        : Promise.resolve([]),
      prisma.species.findMany({ where: { name: { contains: q } }, select: { id: true, name: true, slug: true, dangerLevel: true }, take: LIMIT }),
      prisma.ticket.findMany({ where: { title: { contains: q } }, select: { id: true, title: true, status: true }, orderBy: { id: 'desc' }, take: LIMIT }),
      prisma.bulletinPage.findMany({ where: { status: 'PUBLISHED', title: { contains: q } }, select: { id: true, title: true, slug: true, kind: true }, take: LIMIT }),
      prisma.lair.findMany({ where: { name: { contains: q } }, select: { id: true, name: true, wing: true }, take: LIMIT }),
    ])

    const hits: SearchHit[] = [
      ...monsters.map((m) => ({ type: 'monster' as const, id: m.id, title: m.name, subtitle: `${m.species?.name ?? '?'} · ${m.status?.toLowerCase()}`, url: `/monsters/${m.id}/profile` })),
      ...customers.map((c) => ({
        type: 'customer' as const,
        id: c.id,
        title: [c.title, c.firstName, c.lastName].filter(Boolean).join(' '),
        subtitle: c.email,
        url: `/customers/${c.id}`,
      })),
      ...species.map((s) => ({ type: 'species' as const, id: s.id, title: s.name, subtitle: '💀'.repeat(s.dangerLevel), url: `/species/${s.slug}` })),
      ...lairs.map((l) => ({ type: 'lair' as const, id: l.id, title: l.name, subtitle: l.wing.replace('_', ' ').toLowerCase(), url: `/lairs/${l.id}` })),
      ...tickets.map((t) => ({ type: 'ticket' as const, id: t.id, title: `#${t.id} ${t.title}`, subtitle: t.status.toLowerCase(), url: `/tickets/${t.id}` })),
      ...pages.map((p) => ({
        type: 'bulletin' as const,
        id: p.id,
        title: p.title,
        subtitle: p.kind === 'PAGE' ? 'page' : 'news',
        url: `/bulletin/${p.kind === 'PAGE' ? 'pages' : 'posts'}/${p.slug}`,
      })),
    ]
    res.json(hits)
  }),
)
