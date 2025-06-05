export const ROLES = ['ADMIN', 'FRONT_DESK', 'KEEPER', 'VET', 'THERAPIST', 'SCRIBE', 'OWNER', 'OVERLORD', 'STAFF'] as const

export type Role = (typeof ROLES)[number]

/** Roles held by castle employees. */
// SCRIBE counts as staff: scribes work in the castle and need the staff menu + Bulletin
export const STAFF_ROLES: readonly Role[] = ['ADMIN', 'FRONT_DESK', 'KEEPER', 'VET', 'THERAPIST', 'SCRIBE']

/** Roles held by customers. A customer can be both. */
export const CUSTOMER_ROLES: readonly Role[] = ['OWNER', 'OVERLORD']

export type RoleHolder = { roles: readonly Role[] }

/**
 * True if the user holds at least one of the given roles.
 *
 * `STAFF` is the single catch-all staff role from before the role split
 * (2023). Until every old account has been given its real roles, a STAFF
 * account counts as holding any of the STAFF_ROLES. ADMIN is never implied.
 */
export function hasRole(user: RoleHolder | null | undefined, ...roles: Role[]): boolean {
  if (!user) return false
  if (roles.some((r) => user.roles.includes(r))) return true
  if (user.roles.includes('STAFF')) {
    return roles.some((r) => r !== 'ADMIN' && STAFF_ROLES.includes(r))
  }
  return false
}

export function isStaff(user: RoleHolder | null | undefined): boolean {
  return hasRole(user, ...STAFF_ROLES)
}
