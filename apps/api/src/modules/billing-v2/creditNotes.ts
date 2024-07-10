// Credit notes for Billing v2 (part 3 of 3) 🧾
//
// A credit note gives money back against an issued invoice (dragon was
// collected early, goblin ate the wrong potion, goodwill gesture...).
// It is just a negative invoice that points at the original.
//
// TODO(morgan): wire up routes + UI next week
// TODO(morgan): store credit notes in invoices_v2 with kind=CREDIT? or own table?
// TODO(morgan): flip ENABLE_BILLING_V2 on once this lands 🎉
import type { Copper } from '@bandage/shared'
import type { LineDraft } from './engine'

export type CreditNoteDraft = {
  originalInvoiceId: number
  reason: string
  lines: LineDraft[]
  totalCopper: Copper
}

/** Build a credit note that refunds `amountCopper` of an invoice. */
export function draftCreditNote(originalInvoiceId: number, amountCopper: Copper, reason: string): CreditNoteDraft {
  if (amountCopper <= 0) throw new Error('Credit amount must be positive')
  const line: LineDraft = {
    description: `Credit: ${reason}`,
    quantity: 1,
    unitCopper: -amountCopper,
    amountCopper: -amountCopper,
    kind: 'DISCOUNT',
  }
  return { originalInvoiceId, reason, lines: [line], totalCopper: -amountCopper }
}

/** Refund the late fee lines of an invoice, e.g. when the owner was late because of a siege. */
export function creditLateFees(originalInvoiceId: number, lines: LineDraft[]): CreditNoteDraft | null {
  const late = lines.filter((l) => l.kind === 'LATE_FEE').reduce((s, l) => s + l.amountCopper, 0)
  if (late === 0) return null
  return draftCreditNote(originalInvoiceId, late, 'late pickup fee waived')
}
