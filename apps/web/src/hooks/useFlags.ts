import { useFlagsQuery } from './queries'

export type Flags = Record<string, boolean>

/** Feature flags from the API. Everything is off until they have loaded. */
export function useFlags(): Flags {
  const { data } = useFlagsQuery()
  return data ?? {}
}
