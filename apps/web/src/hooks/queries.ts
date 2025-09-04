// React Query hooks. The future! 🚀 Add new data fetching here.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api'

export const queryKeys = {
  flags: ['flags'] as const,
  invoiceV2: (id: number) => ['invoices-v2', id] as const,
  invoicesV2: ['invoices-v2'] as const,
}

export function useFlagsQuery() {
  return useQuery({ queryKey: queryKeys.flags, queryFn: () => apiFetch('/flags') as Promise<Record<string, boolean>> })
}

export function useInvoicesV2() {
  return useQuery({ queryKey: queryKeys.invoicesV2, queryFn: () => apiFetch('/v2/billing/invoices') })
}

export function useCreateInvoiceFromStay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stayId: number) => apiFetch(`/v2/billing/invoices/from-stay/${stayId}`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.invoicesV2 }),
  })
}

// --- dashboards (2025) ---

export function useDashboard<T>(section: string) {
  return useQuery({ queryKey: ['dashboard', section], queryFn: () => apiFetch(`/dashboard/${section}`) as Promise<T> })
}
