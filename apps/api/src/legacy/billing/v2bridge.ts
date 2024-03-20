// Bridge: serve Billing v2 data in the legacy invoice shape, so the old
// invoice screens get the new numbers without being rewritten.
// Temporary until part 3 (screens on v2). -- Morgan
import { getByLegacyId } from '../../modules/billing-v2/billing-v2.service'

export function billingV2Enabled() {
  return !!process.env.ENABLE_BILLING_V2
}

export async function legacyShapedInvoice(legacyId: number) {
  const v2: any = await getByLegacyId(legacyId)
  return {
    id: legacyId,
    stay_id: v2.stayId,
    customer_id: v2.customerId,
    issued_at: v2.issuedAt,
    due_date: v2.dueAt,
    total: v2.totalCopper / 100,
    status: v2.status === 'ISSUED' ? 'UNPAID' : v2.status,
    title: v2.customer?.title,
    first_name: v2.customer?.firstName,
    last_name: v2.customer?.lastName,
    lair_address: v2.customer?.lairAddress,
    lines: v2.lines.map((l: any) => ({
      id: l.id,
      description: l.description,
      qty: l.quantity,
      unit_price: l.unitCopper / 100,
      amount: l.amountCopper / 100,
      kind: l.kind,
    })),
    payments: v2.payments.map((p: any) => ({ id: p.id, amount: p.amountCopper / 100, method: p.method, paid_at: p.receivedAt })),
    billing_version: 2,
  }
}
