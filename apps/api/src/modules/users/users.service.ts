import bcrypt from 'bcryptjs'
import type { Role } from '@bandage/shared'
import { prisma } from '../../db/prisma'
import { BadRequestError, ConflictError, NotFoundError } from '../../errors/httpErrors'
import type { CreateUserInput, UpdateUserInput } from './users.schema'
import * as audit from '../audit/audit.service'

export type UserDto = {
  id: number
  email: string
  name: string | null
  roles: Role[]
  createdAt: Date | null
}

const include = { roles: true } as const

function toDto(u: { id: number; email: string; displayName: string | null; createdAt: Date | null; role: string; roles: { role: string }[] }): UserDto {
  return {
    id: u.id,
    email: u.email,
    name: u.displayName,
    roles: (u.roles.length ? u.roles.map((r) => r.role) : [u.role]) as Role[],
    createdAt: u.createdAt,
  }
}

export async function listUsers(search?: string): Promise<UserDto[]> {
  const users = await prisma.user.findMany({
    where: search ? { OR: [{ email: { contains: search } }, { displayName: { contains: search } }] } : undefined,
    include,
    orderBy: { email: 'asc' },
  })
  return users.map(toDto)
}

export async function getUser(id: number): Promise<UserDto> {
  const user = await prisma.user.findUnique({ where: { id }, include })
  if (!user) throw new NotFoundError('User')
  return toDto(user)
}

export async function createUser(input: CreateUserInput): Promise<UserDto> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new ConflictError('A user with that email already exists')
  const user = await prisma.user.create({
    data: {
      email: input.email,
      displayName: input.name,
      passwordHash: await bcrypt.hash(input.password, 10),
      // legacy column: keep something sensible in it for the old code
      role: input.roles.includes('ADMIN') ? 'ADMIN' : input.roles[0],
      roles: { create: input.roles.map((role) => ({ role })) },
    },
    include,
  })
  return toDto(user)
}

export async function updateUser(id: number, input: UpdateUserInput, actingUserId: number): Promise<UserDto> {
  const before = await getUser(id)
  if (id === actingUserId && input.roles && !input.roles.includes('ADMIN')) {
    throw new BadRequestError("You can't remove your own ADMIN role. Ask another admin.")
  }
  const user = await prisma.$transaction(async (tx) => {
    if (input.roles) {
      await tx.userRole.deleteMany({ where: { userId: id } })
      await tx.userRole.createMany({ data: input.roles.map((role) => ({ userId: id, role })) })
    }
    return tx.user.update({
      where: { id },
      data: { displayName: input.name },
      include,
    })
  })
  const after = toDto(user)
  await audit.record({ actorId: actingUserId, entity: 'user', entityId: id, action: 'UPDATE', ...audit.diff(before, after) })
  return after
}
