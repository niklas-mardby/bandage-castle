import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../../db/prisma'
import { config } from '../../config'
import { BadRequestError, UnauthorizedError } from '../../errors/httpErrors'

const RESET_TTL_MINUTES = 60

export async function verifyCredentials(email: string, password: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { email } })
  // Compare against a dummy hash when the user doesn't exist so timing doesn't leak which emails are registered.
  const hash = user?.passwordHash ?? '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.ub4i6S5b8vXjTcgf3aZ7xqJ9pS8a'
  const ok = await bcrypt.compare(password, hash)
  if (!user || !ok) throw new UnauthorizedError('Wrong email or password')
  return user.id
}

export async function changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new UnauthorizedError()
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) throw new BadRequestError('Your current password is wrong')
  if (currentPassword === newPassword) throw new BadRequestError('The new password must be different')
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } })
}

export async function updateProfile(userId: number, name: string) {
  await prisma.user.update({ where: { id: userId }, data: { displayName: name } })
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return
  const token = crypto.randomBytes(24).toString('hex')
  await prisma.passwordReset.create({
    data: { userId: user.id, token, expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60_000) },
  })
  // We don't send real email (yet). The link goes to the API console.
  console.log(`🔑 Password reset for ${email}: ${config.webUrl}/reset-password?token=${token}`)
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const reset = await prisma.passwordReset.findFirst({ where: { token, expiresAt: { gt: new Date() } } })
  if (!reset) throw new BadRequestError('This reset link has expired. Ask for a new one.')
  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
    prisma.passwordReset.deleteMany({ where: { userId: reset.userId } }),
  ])
}
