import { Router } from 'express'
import { asyncHandler } from '../../middleware/asyncHandler'
import { requireUser } from '../../middleware/requireRole'
import { validate } from '../../middleware/validate'
import { changePasswordSchema, forgotSchema, loginSchema, profileSchema, resetSchema } from './auth.schema'
import * as authService from './auth.service'
import { clearSession, issueSession, loadSessionUser } from './session'

export const authRouter = Router()

authRouter.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const userId = await authService.verifyCredentials(req.body.email, req.body.password)
    issueSession(res, userId)
    res.json(await loadSessionUser(userId))
  }),
)

authRouter.post('/logout', (_req, res) => {
  clearSession(res)
  res.status(204).end()
})

authRouter.get('/me', requireUser, (req, res) => {
  res.json(req.user)
})

authRouter.post(
  '/change-password',
  requireUser,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword)
    res.json({ ok: true })
  }),
)

authRouter.patch(
  '/me',
  requireUser,
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    await authService.updateProfile(req.user!.id, req.body.name)
    res.json(await loadSessionUser(req.user!.id))
  }),
)

authRouter.post(
  '/forgot',
  validate(forgotSchema),
  asyncHandler(async (req, res) => {
    await authService.requestPasswordReset(req.body.email)
    res.json({ ok: true })
  }),
)

authRouter.post(
  '/reset',
  validate(resetSchema),
  asyncHandler(async (req, res) => {
    await authService.resetPassword(req.body.token, req.body.password)
    res.json({ ok: true })
  }),
)
