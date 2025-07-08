// API smoke tests against the real (seeded) database.
// Run `npm run setup` first. They only read data, so they are safe to run any time.
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from './app'
import { prisma } from './db/prisma'

const app = createApp()

async function loginAs(email: string) {
  const agent = request.agent(app)
  const res = await agent.post('/api/auth/login').send({ email, password: 'castle123' })
  expect(res.status).toBe(200)
  return agent
}

describe('API smoke tests', () => {
  let admin: Awaited<ReturnType<typeof loginAs>>
  let owner: Awaited<ReturnType<typeof loginAs>>

  beforeAll(async () => {
    admin = await loginAs('admin@bandage.castle')
    owner = await loginAs('owner@bandage.castle')
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('is healthy', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('rejects a wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@bandage.castle', password: 'dragon' })
    expect(res.status).toBe(401)
  })

  it('validates login input', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email' })
    expect(res.status).toBe(400)
  })

  it('knows who you are', async () => {
    const res = await admin.get('/api/auth/me')
    expect(res.body.email).toBe('admin@bandage.castle')
    expect(res.body.roles).toContain('ADMIN')
  })

  it('needs a session for module routes', async () => {
    const res = await request(app).get('/api/species')
    expect(res.status).toBe(401)
  })

  it('lists the species compendium', async () => {
    const res = await admin.get('/api/species')
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(30)
    const basilisk = res.body.find((s: { name: string }) => s.name === 'Basilisk')
    expect(basilisk.incompatibleWith.map((r: { speciesName: string }) => r.speciesName)).toContain('Cockatrice')
  })

  it('keeps owners out of admin pages', async () => {
    const res = await owner.get('/api/users')
    expect(res.status).toBe(403)
  })

  it('shows owners their own monsters', async () => {
    const res = await owner.get('/api/monsters?mine=1')
    expect(res.status).toBe(200)
    expect(res.body.map((m: { name: string }) => m.name)).toContain('Sir Snortlewick')
  })

  it('has a feeding schedule for today', async () => {
    const res = await admin.get('/api/feeding/schedule')
    expect(res.status).toBe(200)
    expect(res.body.entries.length).toBeGreaterThan(0)
  })

  it('pages through tickets', async () => {
    const res = await admin.get('/api/tickets?take=10')
    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(10)
    expect(res.body.nextCursor).not.toBeNull()
  })
})
