/* eslint-disable no-console */
// Copies legacy invoices (tbl_invoice) into invoices_v2, converting gold to copper.
//
//   npx tsx scripts/backfill-billing-v2.ts [--before 2024-03-01] [--dry-run]
//
// Idempotent: invoices that already have a v2 copy are skipped.
// Part 2 of 3: we backfill everything before March 2024 now; part 3 runs it
// again for the rest right before we flip ENABLE_BILLING_V2.
import path from 'path'
import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

config({ path: path.resolve(__dirname, '../.env') })
const prisma = new PrismaClient()

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const beforeIdx = args.indexOf('--before')
const before = new Date(beforeIdx >= 0 ? args[beforeIdx + 1] : '2024-03-01')

const toCopper = (gold: unknown) => Math.round(Number(gold ?? 0) * 100)

async function main() {
  const legacy = await prisma.invoice.findMany({
    where: { issuedAt: { lt: before } },
    include: { lines: true, payments: true },
    orderBy: { id: 'asc' },
  })
  let created = 0
  let skipped = 0

  for (const inv of legacy) {
    if (await prisma.invoiceV2.findUnique({ where: { legacyInvoiceId: inv.id } })) {
      skipped++
      continue
    }
    const lines = inv.lines.map((l, position) => ({
      description: l.description ?? '',
      quantity: l.qty ?? 1,
      unitCopper: toCopper(l.unitPrice),
      amountCopper: toCopper(l.amount),
      kind: l.kind ?? 'OTHER',
      position,
    }))
    const total = lines.reduce((s, l) => s + l.amountCopper, 0)
    const year = (inv.issuedAt ?? new Date()).getFullYear()

    if (!dryRun) {
      await prisma.invoiceV2.create({
        data: {
          legacyInvoiceId: inv.id,
          stayId: inv.stayId,
          customerId: inv.customerId,
          number: `BC-${year}-L${String(inv.id).padStart(5, '0')}`,
          status: inv.status === 'PAID' ? 'PAID' : inv.status === 'VOID' ? 'VOID' : 'ISSUED',
          issuedAt: inv.issuedAt,
          dueAt: inv.dueDate,
          subtotalCopper: total,
          totalCopper: total,
          lines: { create: lines },
          payments: {
            create: inv.payments.map((p) => ({ amountCopper: toCopper(p.amount), method: p.method ?? 'GOLD', receivedAt: p.paidAt ?? new Date() })),
          },
        },
      })
    }
    created++
  }
  console.log(`🪙 ${dryRun ? '[dry run] would create' : 'created'} ${created} v2 invoices, skipped ${skipped} (before ${before.toISOString().slice(0, 10)})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
