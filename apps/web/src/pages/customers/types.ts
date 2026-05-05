export type ContactPref = 'raven' | 'crystal ball' | 'email'

export type CustomerSummary = {
  id: number
  userId: number | null
  title: string | null
  firstName: string | null
  lastName: string | null
  name: string
  email: string | null
  contactPref: ContactPref | null
  lairAddress: string | null
  notes: string | null
  monsterCount: number
  stayCount: number
  owedGold: number
}

export type CustomerDetail = Omit<CustomerSummary, 'monsterCount' | 'stayCount' | 'owedGold'> & {
  user: { id: number; email: string } | null
  monsters: { id: number; name: string; status: string; species: { name: string } | null }[]
  stays: { id: number; reason: string; status: string; startDate: string | null; expectedPickup: string | null; monster: { id: number; name: string } }[]
  invoices: { id: number; total: number; status: string; issuedAt: string | null; dueDate: string | null }[]
  ravensSent: number
}

export const CONTACT_ICON: Record<ContactPref, string> = { raven: '🐦', 'crystal ball': '🔮', email: '📧' }
