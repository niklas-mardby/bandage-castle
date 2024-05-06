import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatCopper, toCopper } from '@bandage/shared'
import { apiFetch } from '../../api'
import { useFlags } from '../../hooks/useFlags'
import { formatDay } from '../../utils/dates'

type InvoiceV2 = {
  id: number
  number: string
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID'
  customerId: number
  issuedAt: string | null
  dueAt: string | null
  totalCopper: number
  paidCopper: number
  balanceCopper: number
  legacyInvoiceId: number | null
}

function PayForm({ invoice, onDone }: { invoice: InvoiceV2; onDone: () => void }) {
  const [gold, setGold] = useState((invoice.balanceCopper / 100).toFixed(2))
  const [method, setMethod] = useState('GOLD')
  const pay = useMutation({
    mutationFn: () => apiFetch(`/v2/billing/invoices/${invoice.id}/payments`, { method: 'POST', body: { amountCopper: toCopper(gold), method } }),
    onSuccess: onDone,
  })
  return (
    <span className="movement">
      <input className="small" value={gold} onChange={(e) => setGold(e.target.value)} />
      <select value={method} onChange={(e) => setMethod(e.target.value)}>
        <option>GOLD</option>
        <option>GEMS</option>
        <option>IOU</option>
        <option>FAVOUR</option>
      </select>
      <button onClick={() => pay.mutate()} disabled={pay.isPending}>
        Pay
      </button>
      {pay.error && <span className="error">{(pay.error as Error).message}</span>}
    </span>
  )
}

export default function InvoicesV2Page() {
  const flags = useFlags()
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices-v2', status],
    queryFn: () => apiFetch(`/v2/billing/invoices${status ? `?status=${status}` : ''}`) as Promise<InvoiceV2[]>,
  })

  const outstanding = (invoices ?? []).filter((i) => i.status === 'ISSUED').reduce((s, i) => s + i.balanceCopper, 0)

  return (
    <div className="page">
      <h2>💰 Invoices (Billing v2) {!flags.ENABLE_BILLING_V2 && <span className="badge badge-warn">preview, flag is off</span>}</h2>
      <p>
        Outstanding: <b>{formatCopper(outstanding)}</b>
      </p>
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All</option>
        <option value="ISSUED">Issued</option>
        <option value="PAID">Paid</option>
        <option value="VOID">Void</option>
      </select>
      {isLoading && <p>Loading...</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Number</th>
            <th>Issued</th>
            <th>Due</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {invoices?.map((i) => (
            <tr key={i.id}>
              <td>
                {i.number} {i.legacyInvoiceId && <span className="muted">(was #{i.legacyInvoiceId})</span>}
              </td>
              <td>{formatDay(i.issuedAt)}</td>
              <td>{formatDay(i.dueAt)}</td>
              <td>{formatCopper(i.totalCopper)}</td>
              <td>{formatCopper(i.paidCopper)}</td>
              <td>{i.status}</td>
              <td>{i.status === 'ISSUED' && <PayForm invoice={i} onDone={() => qc.invalidateQueries({ queryKey: ['invoices-v2'] })} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
