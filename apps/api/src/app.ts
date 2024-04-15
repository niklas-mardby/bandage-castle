import express from 'express'
import cookieParser from 'cookie-parser'
import { legacyRouter } from './legacy'
import { authenticate } from './middleware/requireRole'
import { errorHandler } from './middleware/errorHandler'
import { authRouter } from './modules/auth/auth.routes'
import { usersRouter } from './modules/users/users.routes'
import { speciesRouter } from './modules/species/species.routes'
import { lairsRouter } from './modules/lairs/lairs.routes'
import { intakeRouter } from './modules/intake/intake.routes'
import { medicalRouter } from './modules/medical/medical.routes'
import { ticketsRouter } from './modules/tickets/tickets.routes'
import { suppliesRouter } from './modules/supplies/supplies.routes'
import { stayExtensionsRouter } from './modules/stays/extensions.routes'
import { staysRouter } from './modules/stays/stays.routes'
import { feedingRouter } from './modules/feeding/feeding.routes'
import { hiringRouter } from './modules/hiring/hiring.routes'
import { flagsRouter } from './modules/flags/flags.routes'
import { billingV2Router } from './modules/billing-v2/billing-v2.routes'
import { notificationsRouter } from './modules/notifications/notifications.routes'

export function createApp() {
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.use(authenticate)

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  // modules
  app.use('/api/auth', authRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/species', speciesRouter)
  app.use('/api/lairs', lairsRouter)
  app.use('/api/intake', intakeRouter)
  app.use('/api/medical', medicalRouter)
  app.use('/api/tickets', ticketsRouter)
  app.use('/api/supplies', suppliesRouter)
  app.use('/api/feeding', feedingRouter)
  app.use('/api/hiring', hiringRouter)
  app.use('/api/flags', flagsRouter)
  app.use('/api/v2/billing', billingV2Router)
  app.use('/api/notifications', notificationsRouter)
  app.use('/api/stays', stayExtensionsRouter, staysRouter) // the rest of /api/stays is in legacy

  // pre-2023 routes
  app.use('/api', legacyRouter)

  app.use(errorHandler)
  return app
}
