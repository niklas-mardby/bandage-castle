import { formatCopper, type Copper } from '@bandage/shared'

/** Server-side money formatting for ravens, PDFs and CSV exports. Takes COPPER. */
export function formatGold(copper: Copper): string {
  return formatCopper(copper)
}
