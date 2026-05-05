// Everything Gorm built before the 2023 restructure lives under legacy/.
// New modules go in src/modules and must not import from here
// (see docs/CONVENTIONS.md).
import { Router } from 'express'
import monsterRoutes from './monsters/monsters.routes'
import customerRoutes from './customers/customers.routes'
import stayRoutes from './stays/stays.routes'
import billingRoutes from './billing/billing.routes'
import ravenRoutes from './ravenPost/raven.routes'
import reportRoutes from './reports/reports.routes'
import tournamentRoutes from './tournament/tournament.routes'

export const legacyRouter = Router()

legacyRouter.use('/monsters', monsterRoutes)
legacyRouter.use('/customers', customerRoutes) // shadowed by modules/customers since 2026-05. TODO: delete legacy/customers
legacyRouter.use('/stays', stayRoutes)
legacyRouter.use('/billing', billingRoutes)
legacyRouter.use('/ravens', ravenRoutes)
legacyRouter.use('/reports', reportRoutes)
legacyRouter.use('/arena', tournamentRoutes) // on hold, see tournament/tournament.routes.ts

export { startRavenLoop } from './ravenPost/ravenPost'
