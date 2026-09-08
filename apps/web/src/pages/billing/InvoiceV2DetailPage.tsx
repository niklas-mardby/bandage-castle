import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatCopper, toCopper } from '@bandage/shared'
import { apiFetch } from '../../api'
import { Button, Card, ConfirmModal, ErrorMessage, Spinner, StatusBadge } from '../../components/ui'
import { formatDateTime, formatDay } from '../../utils/dates'

type Line = { id: number; description: string; quantity: number; unitCopper: number; amountCopper: number; kind: string }
type Payment = { id: number; amountCopper: number; method: string; receivedAt: string; note: string | null }
type Invoice = {
  id: number
  number: string
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID'
  issuedAt: string | null
  dueAt: string | null
  stayId: number | null
  legacyInvoiceId: number | null
  totalCopper: number
  paidCopper: number
  balanceCopper: number
  lines: Line[]
  payments: Payment[]
  customer: { id: number; title: string | null; firstName: string | null; lastName: string | null; lairAddress: string | null } | null
  isPreview: boolean
}

const KIND_ICON: Record<string, string> = { STAY: '🛏️', TREATMENT: '🩹', THERAPY: '🛋️', LATE_FEE: '⏰', DISCOUNT: '🎁', OTHER: '📄' }

export default function InvoiceV2DetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const key = ['invoice-v2', Number(id)]
  const { data: inv, error, isLoading } = useQuery({ queryKey: key, queryFn: () => apiFetch(`/v2/billing/invoices/${id}`) as Promise<Invoice> })
  const [gold, setGold] = useState('')
  const [method, setMethod] = useState('GOLD')
  const [confirmVoid, setConfirmVoid] = useState(false)

  const refresh = () => {
    qc.invalidateQueries({ queryKey: key })
    qc.invalidateQueries({ queryKey: ['invoices-v2'] })
  }
  const pay = useMutation({
    mutationFn: () => apiFetch(`/v2/billing/invoices/${id}/payments`, { method: 'POST', body: { amountCopper: toCopper(gold), method } }),
    onSuccess: () => {
      setGold('')
      refresh()
    },
  })
  const voidIt = useMutation({ mutationFn: () => apiFetch(`/v2/billing/invoices/${id}/void`, { method: 'POST' }), onSuccess: refresh })

  if (isLoading) return <Spinner />
  if (error || !inv) return <ErrorMessage error={error ?? 'Not found'} />

  const customer = inv.customer ? [inv.customer.title, inv.customer.firstName, inv.customer.lastName].filter(Boolean).join(' ') : '?'

  return (
    <div className="page invoice">
      <Link to="/billing/v2">← Invoices v2</Link>
      <h2>
        🧾 {inv.number} <StatusBadge status={inv.status} />
      </h2>
      <p>
        To <Link to={`/customers/${inv.customer?.id}`}>{customer}</Link>
        {inv.customer?.lairAddress && <span className="muted"> · {inv.customer.lairAddress}</span>}
      </p>
      <p className="muted">
        Issued {formatDay(inv.issuedAt)} · due {formatDay(inv.dueAt)}
        {inv.stayId && (
          <>
            {' '}
            · <Link to={`/stays/${inv.stayId}`}>stay #{inv.stayId}</Link>
          </>
        )}
        {inv.legacyInvoiceId && <> · copied from old invoice #{inv.legacyInvoiceId}</>}
      </p>

      <Card title="Lines">
        <table className="table">
          <thead>
            <tr>
              <th />
              <th>Description</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l) => (
              <tr key={l.id}>
                <td>{KIND_ICON[l.kind] ?? ''}</td>
                <td>{l.description}</td>
                <td>{l.quantity}</td>
                <td>{formatCopper(l.unitCopper)}</td>
                <td>{formatCopper(l.amountCopper)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4}>
                <b>Total</b>
              </td>
              <td>
                <b>{formatCopper(inv.totalCopper)}</b>
              </td>
            </tr>
            <tr>
              <td colSpan={4}>Paid</td>
              <td>{formatCopper(inv.paidCopper)}</td>
            </tr>
            <tr>
              <td colSpan={4}>Outstanding</td>
              <td className={inv.balanceCopper > 0 ? 'warn-text' : ''}>{formatCopper(inv.balanceCopper)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>

      <Card title="💰 Payments">
        {inv.payments.length === 0 && <p className="muted">No payments yet.</p>}
        <ul>
          {inv.payments.map((p) => (
            <li key={p.id}>
              {formatDateTime(p.receivedAt)}: {formatCopper(p.amountCopper)} in {p.method.toLowerCase()} {p.note && <span className="muted">({p.note})</span>}
            </li>
          ))}
        </ul>
        {inv.status === 'ISSUED' && (
          <div className="form inline">
            <input className="small" placeholder={(inv.balanceCopper / 100).toFixed(2)} value={gold} onChange={(e) => setGold(e.target.value)} />
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>GOLD</option>
              <option>GEMS</option>
              <option>IOU</option>
              <option>FAVOUR</option>
            </select>
            <Button variant="primary" loading={pay.isPending} disabled={!gold || isNaN(Number(gold))} onClick={() => pay.mutate()}>
              Record payment
            </Button>
          </div>
        )}
        <ErrorMessage error={pay.error} />
      </Card>

      {inv.status !== 'VOID' && (
        <Button variant="danger" onClick={() => setConfirmVoid(true)}>
          Void invoice
        </Button>
      )}
      <ConfirmModal
        open={confirmVoid}
        title="Void this invoice?"
        message="It stays in the books but nobody has to pay it. This can't be undone."
        confirmLabel="Void it"
        onCancel={() => setConfirmVoid(false)}
        onConfirm={() => {
          setConfirmVoid(false)
          voidIt.mutate()
        }}
      />
    </div>
  )
}
