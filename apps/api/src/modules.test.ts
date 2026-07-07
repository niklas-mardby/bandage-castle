// Read-only tour through every module, as different roles. Needs the seeded database (npm run setup).
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from './app'
import { prisma } from './db/prisma'

const app = createApp()
type Agent = ReturnType<typeof request.agent>
const agents: Record<string, Agent> = {}

async function login(key: string, email: string) {
  const agent = request.agent(app)
  const res = await agent.post('/api/auth/login').send({ email, password: 'castle123' })
  expect(res.status).toBe(200)
  agents[key] = agent
}

beforeAll(async () => {
  await Promise.all([
    login('admin', 'admin@bandage.castle'),
    login('desk', 'frontdesk@bandage.castle'),
    login('keeper', 'keeper@bandage.castle'),
    login('vet', 'vet@bandage.castle'),
    login('therapist', 'therapist@bandage.castle'),
    login('scribe', 'scribe@bandage.castle'),
    login('owner', 'owner@bandage.castle'),
    login('overlord', 'overlord@bandage.castle'),
  ])
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('dashboards', () => {
  it.each([
    ['admin', '/api/dashboard/admin'],
    ['desk', '/api/dashboard/front-desk'],
    ['keeper', '/api/dashboard/keeper'],
    ['vet', '/api/dashboard/vet'],
    ['therapist', '/api/dashboard/therapist'],
    ['scribe', '/api/dashboard/scribe'],
    ['owner', '/api/dashboard/me'],
  ])('%s can load %s', async (who, path) => {
    const res = await agents[who].get(path)
    expect(res.status).toBe(200)
  })

  it('owners see their own monsters on the dashboard', async () => {
    const res = await agents.owner.get('/api/dashboard/me')
    expect(res.body.monsters.map((m: { name: string }) => m.name)).toContain('Sir Snortlewick')
  })
})

describe('staff modules', () => {
  it.each([
    '/api/lairs',
    '/api/lairs/unassigned',
    '/api/tickets/assignees',
    '/api/supplies',
    '/api/supplies/low',
    '/api/feeding/overrides',
    '/api/hiring/listings/all',
    '/api/hiring/applications',
    '/api/hiring/contracts',
    '/api/v2/billing/invoices',
    '/api/customers',
    '/api/customers/2',
    '/api/reports-v2/occupancy',
    '/api/reports-v2/revenue-by-reason',
    '/api/reports-v2/stays-per-month',
    '/api/reports-v2/top-customers',
    '/api/reports-v2/average-stay',
    '/api/reports-v2/hiring',
    '/api/monster-profiles/1',
    '/api/stays/calendar',
    '/api/stays/1/details',
    '/api/booking-requests',
    '/api/audit',
    '/api/settings',
    '/api/flags/detailed',
    '/api/bulletin',
    '/api/notifications',
  ])('admin GET %s', async (path) => {
    const res = await agents.admin.get(path)
    expect(res.status).toBe(200)
  })

  it('lair details include residents', async () => {
    const lairs = await agents.keeper.get('/api/lairs')
    const vault = lairs.body.find((l: { name: string }) => l.name === 'The Ember Vault')
    const res = await agents.keeper.get(`/api/lairs/${vault.id}`)
    expect(res.body.residents.map((r: { name: string }) => r.name)).toContain('Sir Snortlewick')
  })

  it('vets see their patients and medical history', async () => {
    const patients = await agents.vet.get('/api/medical/patients')
    expect(patients.status).toBe(200)
    const hester = patients.body.find((p: { name: string }) => p.name === 'Hester')
    const history = await agents.vet.get(`/api/medical/monsters/${hester.id}/records`)
    expect(history.body.records.length).toBeGreaterThan(0)
    expect((await agents.vet.get('/api/medical/prescriptions/active')).status).toBe(200)
  })

  it('therapists see plans, and keepers do not', async () => {
    const plans = await agents.therapist.get('/api/therapy/plans')
    expect(plans.status).toBe(200)
    const mumbles = plans.body.find((p: { monster: { name: string } }) => p.monster.name === 'Mumbles')
    expect((await agents.therapist.get(`/api/therapy/plans/${mumbles.id}`)).body.sessions.length).toBeGreaterThan(0)
    expect((await agents.keeper.get('/api/therapy/plans')).status).toBe(403)
  })

  it('scribes can read drafts in the Bulletin', async () => {
    const res = await agents.scribe.get('/api/bulletin')
    expect(res.body.some((p: { status: string }) => p.status === 'DRAFT')).toBe(true)
    const page = await agents.scribe.get('/api/bulletin/fire-safety-in-the-north-tower')
    expect(page.body.bodyMd).toContain('Fire safety')
  })

  it('the species page lists individuals', async () => {
    const res = await agents.keeper.get('/api/species/dragon')
    expect(res.body.monsters.length).toBeGreaterThan(0)
  })

  it('classic reports still work', async () => {
    expect((await agents.desk.get('/api/reports/occupancy')).status).toBe(200)
    expect((await agents.desk.get('/api/reports/revenue')).status).toBe(200)
  })

  it('the stays list and the invoice list load', async () => {
    expect((await agents.desk.get('/api/stays')).status).toBe(200)
    expect((await agents.desk.get('/api/billing/invoices')).status).toBe(200)
  })
})

describe('customers', () => {
  it('overlords see the Hiring Hall', async () => {
    const res = await agents.overlord.get('/api/hiring/listings')
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
    const listing = await agents.overlord.get(`/api/hiring/listings/${res.body[0].id}`)
    expect(listing.status).toBe(200)
  })

  it('owners can read their own customer profile', async () => {
    const res = await agents.owner.get('/api/customers/me')
    expect(res.body.lastName).toBe('Grimsby')
  })

  it('owners cannot see the customer list', async () => {
    expect((await agents.owner.get('/api/customers')).status).toBe(403)
  })

  it('owners see their invoices', async () => {
    const res = await agents.owner.get('/api/billing/invoices?mine=1')
    expect(res.status).toBe(200)
  })
})
