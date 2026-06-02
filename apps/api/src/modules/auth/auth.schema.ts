import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
})

export const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Use at least 8 characters. Trolls can count to 6.'),
})

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(191),
})

export const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, 'Use at least 8 characters. Trolls can count to 6.'),
})
