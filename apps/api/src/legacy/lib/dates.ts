import { format } from 'date-fns'

// ageInYears moved to @bandage/shared
export { ageInYears } from '@bandage/shared'

export function fmtDate(d: any) {
  if (!d) return ''
  return format(new Date(d), 'yyyy-MM-dd')
}
