import { format, formatDistanceToNow, parseISO } from 'date-fns'

// date-fns based helpers (2024). Prefer these over moment / hand-rolled formatting.

export function formatDay(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? parseISO(value) : value
  return format(d, 'd MMM yyyy')
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? parseISO(value) : value
  return format(d, 'd MMM yyyy, HH:mm')
}

export function fromNow(value: string | Date): string {
  const d = typeof value === 'string' ? parseISO(value) : value
  return formatDistanceToNow(d, { addSuffix: true })
}
