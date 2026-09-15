import { STAFF_ROLES, type Role } from '@bandage/shared'

export type NavItem = {
  to: string
  label: string
  icon: string
  /** who sees the link; leave out for everyone who is logged in */
  roles?: readonly Role[]
  group: 'main' | 'care' | 'business' | 'admin' | 'me'
}

const STAFF = STAFF_ROLES
const DESK: Role[] = ['ADMIN', 'FRONT_DESK']
const CARE: Role[] = ['ADMIN', 'KEEPER', 'VET']

// One list for the whole menu. Keep it in the same order as the menu.
export const NAV: NavItem[] = [
  { group: 'main', to: '/', label: 'Home', icon: '🏰' },
  { group: 'main', to: '/bulletin', label: 'Bulletin', icon: '📜', roles: STAFF },
  { group: 'main', to: '/species', label: 'Species', icon: '📖' },

  { group: 'care', to: '/monsters', label: 'Monsters', icon: '🐉', roles: STAFF },
  { group: 'care', to: '/lairs', label: 'Lairs', icon: '🏚️', roles: ['ADMIN', 'KEEPER', 'FRONT_DESK', 'VET'] },
  { group: 'care', to: '/feeding', label: 'Feeding', icon: '🍖', roles: CARE },
  { group: 'care', to: '/supply', label: 'Supplies', icon: '📦', roles: CARE },
  { group: 'care', to: '/vet', label: 'Vet', icon: '🩺', roles: ['VET', 'ADMIN'] },
  { group: 'care', to: '/rounds', label: 'Rounds', icon: '🧪', roles: ['VET', 'KEEPER'] },
  { group: 'care', to: '/therapy', label: 'Therapy', icon: '🛋️', roles: ['THERAPIST', 'ADMIN'] },
  { group: 'care', to: '/tickets', label: 'Tickets', icon: '🎫', roles: ['ADMIN', 'KEEPER', 'FRONT_DESK', 'VET'] },

  { group: 'business', to: '/intake', label: 'Intake', icon: '🚪', roles: ['ADMIN', 'FRONT_DESK', 'KEEPER'] },
  { group: 'business', to: '/bookings', label: 'Requests', icon: '📨', roles: DESK },
  { group: 'business', to: '/stays', label: 'Stays', icon: '🛏️', roles: STAFF },
  { group: 'business', to: '/customers', label: 'Customers', icon: '🧾', roles: DESK },
  { group: 'business', to: '/invoices', label: 'Invoices', icon: '💰', roles: DESK },
  { group: 'business', to: '/reports', label: 'Reports', icon: '📊', roles: DESK },
  { group: 'business', to: '/hiring', label: 'Hiring Hall', icon: '🏛️', roles: ['OVERLORD', 'ADMIN', 'FRONT_DESK', 'KEEPER', 'VET'] },

  { group: 'me', to: '/my/monsters', label: 'My monsters', icon: '🐾', roles: ['OWNER'] },
  { group: 'me', to: '/my/invoices', label: 'My invoices', icon: '🧾', roles: ['OWNER'] },
  { group: 'me', to: '/book', label: 'Book a stay', icon: '📅', roles: ['OWNER'] },

  { group: 'admin', to: '/admin/users', label: 'Users', icon: '👥', roles: ['ADMIN'] },
  { group: 'admin', to: '/admin/audit', label: 'Audit', icon: '🕵️', roles: ['ADMIN'] },
  { group: 'admin', to: '/admin/settings', label: 'Settings', icon: '⚙️', roles: ['ADMIN'] },
]
