import { useApi } from './useApi'

export type Flags = Record<string, boolean>

/** Feature flags from the API. Everything is off until they have loaded. */
export function useFlags(): Flags {
  const { data } = useApi<Flags>('/flags')
  return data ?? {}
}
