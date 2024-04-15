// Stay detail, React Query edition ✨ (replaces pages/StayDetailPage.tsx)
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatCopper, toGoldString } from '@bandage/shared'
import { apiFetch } from '../../api'
import { formatDateTime, formatDay } from '../../utils/dates'
import { useFlags } from '../../hooks/useFlags'

type StayDetails = {
  id: number
  reason: string
  status: 'BOOKED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'
  startDate: string | null
  expectedPickup: string | null
  checkedInAt: string | null
  checkedOutAt: string | null
  dailyRate: number
  notes: string | null
  monster: { id: number; name: string; status: string; species: { name: string; slug: string } | null; lair: { id: number; name: string } | null }
  customer: { id: number; title: string | null; firstName: string | null; lastName: string | null; contactPref: string | null }
  extensions: { id: number; oldPickup: string; newPickup: string; reason: string; createdAt: string }[]
  invoices: { id: number; total: number; status: string }[]
  invoicesV2: { id: number; number: string; totalCopper: number; status: string }[]
  intake: { conditionOnArrival: string; weightKg: string | null; injuries: string | null; belongings: string | null } | null
}

const STATUS_ICON: Record<StayDetails['status'], string> = { BOOKED: '📅', CHECKED_IN: '🏰', CHECKED_OUT: '👋', CANCELLED: '✖️' }

function ExtendForm({ stayId, onDone }: { stayId: number; onDone: () => void }) {
  const [newPickup, setNewPickup] = useState('')
  const [reason, setReason] = useState('')
  const extend = useMutation({
    mutationFn: () => apiFetch(`/stays/${stayId}/extend`, { method: 'POST', body: { newPickup, reason } }),
    onSuccess: onDone,
  })
  return (
    <div className="form inline wrap">
      <input type="date" value={newPickup} onChange={(e) => setNewPickup(e.target.value)} />
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="reason, e.g. owner delayed by a siege" />
      <button disabled={!newPickup || reason.length < 3 || extend.isPending} onClick={() => extend.mutate()}>
        Extend
      </button>
      {extend.error && <span className="error">{(extend.error as Error).message}</span>}
    </div>
  )
}

export default function StayDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const flags = useFlags()
  const [showExtend, setShowExtend] = useState(false)
  const key = ['stay', Number(id)]

  const { data: stay, error, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => apiFetch(`/stays/${id}/details`) as Promise<StayDetails>,
  })

  const action = useMutation({
    mutationFn: (what: 'checkin' | 'checkout' | 'cancel') => apiFetch(`/stays/${id}/${what}`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const invoiceV2 = useMutation({
    mutationFn: () => apiFetch(`/v2/billing/invoices/from-stay/${id}`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  if (error) return <p className="page error">{(error as Error).message}</p>
  if (isLoading || !stay) return <p className="page">Loading...</p>

  const owner = `${stay.customer.title ?? ''} ${stay.customer.firstName ?? ''} ${stay.customer.lastName ?? ''}`.trim()

  return (
    <div className="page">
      <Link to="/stays">← Stays</Link>
      <h2>
        {STATUS_ICON[stay.status]} Stay #{stay.id}: <Link to={`/monsters/${stay.monster.id}`}>{stay.monster.name}</Link>
      </h2>
      <p className="muted">
        {stay.monster.species?.name} · {stay.reason.toLowerCase()} · owner <Link to={`/customers/${stay.customer.id}`}>{owner}</Link> (prefers{' '}
        {stay.customer.contactPref})
      </p>

      <div className="cards">
        <div className="card">
          <h4>📅 Dates</h4>
          <p>Start: {formatDay(stay.startDate)}</p>
          <p>
            Pickup: <b>{formatDay(stay.expectedPickup)}</b>
          </p>
          {stay.checkedInAt && <p>Checked in: {formatDateTime(stay.checkedInAt)}</p>}
          {stay.checkedOutAt && <p>Checked out: {formatDateTime(stay.checkedOutAt)}</p>}
        </div>
        <div className="card">
          <h4>🏚️ Lair</h4>
          {stay.monster.lair ? <Link to={`/lairs/${stay.monster.lair.id}`}>{stay.monster.lair.name}</Link> : <p className="muted">No lair assigned</p>}
          <p>Rate: {toGoldString(stay.dailyRate)}/night</p>
        </div>
        {stay.intake && (
          <div className="card">
            <h4>🚪 Intake</h4>
            <p>Condition: {stay.intake.conditionOnArrival.toLowerCase()}</p>
            {stay.intake.weightKg && <p>Weight: {stay.intake.weightKg} kg</p>}
            {stay.intake.injuries && <p>Injuries: {stay.intake.injuries}</p>}
            {stay.intake.belongings && <p>Belongings: {stay.intake.belongings}</p>}
          </div>
        )}
      </div>

      {stay.notes && <p className="description">{stay.notes}</p>}

      <div className="toolbar">
        {stay.status === 'BOOKED' && (
          <>
            <Link to="/intake">Start intake →</Link>
            <button onClick={() => action.mutate('cancel')}>Cancel booking</button>
          </>
        )}
        {stay.status === 'CHECKED_IN' && <button onClick={() => action.mutate('checkout')}>👋 Check out</button>}
        {(stay.status === 'BOOKED' || stay.status === 'CHECKED_IN') && <button onClick={() => setShowExtend(!showExtend)}>⏳ Extend</button>}
      </div>
      {action.error && <p className="error">{(action.error as Error).message}</p>}
      {showExtend && (
        <ExtendForm
          stayId={stay.id}
          onDone={() => {
            setShowExtend(false)
            qc.invalidateQueries({ queryKey: key })
          }}
        />
      )}

      {stay.extensions.length > 0 && (
        <>
          <h3>⏳ Extensions</h3>
          <ul>
            {stay.extensions.map((e) => (
              <li key={e.id}>
                {formatDay(e.oldPickup)} → {formatDay(e.newPickup)}: {e.reason}
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>💰 Invoices</h3>
      <ul>
        {stay.invoices.map((i) => (
          <li key={i.id}>
            <Link to={`/invoices/${i.id}`}>#{i.id}</Link> {toGoldString(i.total)} — {i.status}
          </li>
        ))}
        {stay.invoicesV2.map((i) => (
          <li key={`v2-${i.id}`}>
            {i.number} {formatCopper(i.totalCopper)} — {i.status} <span className="badge badge-ok">v2</span>
          </li>
        ))}
      </ul>
      {flags.ENABLE_BILLING_V2 && stay.status === 'CHECKED_OUT' && stay.invoicesV2.length === 0 && (
        <button onClick={() => invoiceV2.mutate()}>Create v2 invoice</button>
      )}
    </div>
  )
}
