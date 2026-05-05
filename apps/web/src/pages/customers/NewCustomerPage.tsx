import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../api'
import CustomerForm, { EMPTY_CUSTOMER, toPayload, type CustomerFormValue } from './CustomerForm'

export default function NewCustomerPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: (v: CustomerFormValue) => apiFetch('/customers', { method: 'POST', body: toPayload(v) }) as Promise<{ id: number }>,
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      navigate(`/customers/${c.id}`)
    },
  })
  return (
    <div className="page">
      <h2>🧾 New customer</h2>
      <CustomerForm initial={EMPTY_CUSTOMER} submitLabel="Create customer" saving={create.isPending} error={create.error} onSubmit={(v) => create.mutate(v)} />
    </div>
  )
}
