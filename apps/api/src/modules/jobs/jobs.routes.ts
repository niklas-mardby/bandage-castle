import { Router } from 'express'
import { NotFoundError } from '../../errors/httpErrors'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireRole } from '../../middleware/requireRole'
import { JOBS, recentRuns, runJob } from './jobs'

export const jobsRouter = Router()

jobsRouter.use(requireRole('ADMIN'))

jobsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ jobs: JOBS.map(({ name, description, afterHour }) => ({ name, description, afterHour })), runs: await recentRuns() })
  }),
)

jobsRouter.post(
  '/:name/run',
  asyncHandler(async (req, res) => {
    const job = JOBS.find((j) => j.name === req.params.name)
    if (!job) throw new NotFoundError('Job')
    res.json({ summary: await runJob(job, true) })
  }),
)
