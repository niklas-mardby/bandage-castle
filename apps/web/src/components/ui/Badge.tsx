import type { ReactNode } from 'react'

export type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info'

const STATUS_TONES: Record<string, Tone> = {
  // stays
  BOOKED: 'info',
  CHECKED_IN: 'ok',
  CHECKED_OUT: 'neutral',
  CANCELLED: 'neutral',
  // monsters
  IN_RESIDENCE: 'ok',
  HOME: 'neutral',
  AVAILABLE: 'info',
  HIRED: 'neutral',
  RETIRED: 'neutral',
  // invoices
  UNPAID: 'warn',
  ISSUED: 'warn',
  PAID: 'ok',
  VOID: 'neutral',
  // generic
  PENDING: 'warn',
  ACCEPTED: 'ok',
  REJECTED: 'danger',
  OPEN: 'info',
  IN_PROGRESS: 'warn',
  BLOCKED: 'danger',
  DONE: 'ok',
}

export function Badge({ tone = 'neutral', children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return (
    <span className={`ui-badge ui-badge-${tone}`} title={title}>
      {children}
    </span>
  )
}

/** A badge for any of our status strings, coloured consistently everywhere. */
export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null
  return <Badge tone={STATUS_TONES[status] ?? 'neutral'}>{status.toLowerCase().replace(/_/g, ' ')}</Badge>
}
