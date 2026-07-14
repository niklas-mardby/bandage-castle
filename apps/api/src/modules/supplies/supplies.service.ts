import type { Supply } from '@prisma/client'
import { prisma } from '../../db/prisma'
import { BadRequestError, ConflictError, NotFoundError } from '../../errors/httpErrors'
import type { MovementInput, SupplyInput } from './supplies.schema'

export type SupplyDto = Omit<Supply, 'quantity' | 'lowStockThreshold'> & {
  quantity: number
  lowStockThreshold: number
  isLow: boolean
}

// Low stock = we're at or below the threshold, time to order more.
export function isLowStock(s: { quantity: number; lowStockThreshold: number }): boolean {
  return s.lowStockThreshold > s.quantity
}

function toDto(s: Supply): SupplyDto {
  const quantity = Number(s.quantity)
  const lowStockThreshold = Number(s.lowStockThreshold)
  return { ...s, quantity, lowStockThreshold, isLow: isLowStock({ quantity, lowStockThreshold }) }
}

export async function listSupplies(category?: string) {
  const supplies = await prisma.supply.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })
  return supplies.map(toDto)
}

export async function lowStock() {
  return (await listSupplies()).filter((s) => s.isLow)
}

export type ReorderLine = { id: number; name: string; unit: string; quantity: number; lowStockThreshold: number; orderQuantity: number }

/**
 * What to order, per supplier. We top up to twice the reorder level so we
 * don't have to order again next week.
 */
export async function reorderList() {
  const low = await lowStock()
  const bySupplier = new Map<string, ReorderLine[]>()
  for (const s of low) {
    const supplier = s.supplier ?? 'No supplier on file'
    const orderQuantity = Math.max(1, Math.ceil(s.lowStockThreshold * 2 - s.quantity))
    const lines = bySupplier.get(supplier) ?? []
    lines.push({ id: s.id, name: s.name, unit: s.unit, quantity: s.quantity, lowStockThreshold: s.lowStockThreshold, orderQuantity })
    bySupplier.set(supplier, lines)
  }
  return [...bySupplier.entries()].map(([supplier, lines]) => ({ supplier, lines })).sort((a, b) => a.supplier.localeCompare(b.supplier))
}

export async function getSupply(id: number) {
  const supply = await prisma.supply.findUnique({
    where: { id },
    include: { movements: { orderBy: { createdAt: 'desc' }, take: 50 } },
  })
  if (!supply) throw new NotFoundError('Supply')
  const { movements, ...rest } = supply
  return { ...toDto(rest), movements: movements.map((m) => ({ ...m, change: Number(m.change) })) }
}

export async function createSupply(input: SupplyInput) {
  if (await prisma.supply.findUnique({ where: { name: input.name } })) throw new ConflictError('That supply already exists')
  return toDto(await prisma.supply.create({ data: input }))
}

export async function updateSupply(id: number, input: Partial<SupplyInput>) {
  await getSupply(id)
  return toDto(await prisma.supply.update({ where: { id }, data: input }))
}

export async function recordMovement(id: number, input: MovementInput, userId: number) {
  const change = input.reason === 'DELIVERY' ? Math.abs(input.amount) : input.reason === 'ADJUSTMENT' ? input.amount : -Math.abs(input.amount)
  return prisma.$transaction(async (tx) => {
    const supply = await tx.supply.findUnique({ where: { id } })
    if (!supply) throw new NotFoundError('Supply')
    const newQuantity = Number(supply.quantity) + change
    if (newQuantity < 0) throw new BadRequestError(`Only ${Number(supply.quantity)} ${supply.unit} left`)
    await tx.supplyMovement.create({ data: { supplyId: id, change, reason: input.reason, note: input.note, userId } })
    return toDto(await tx.supply.update({ where: { id }, data: { quantity: newQuantity } }))
  })
}
