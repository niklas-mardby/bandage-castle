// Owners book visits; staff see the week's visits. Same page, different halves.
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hasRole } from '@bandage/shared'
import { apiFetch } from '../../api'
import { useAuth } from '../../auth/AuthProvider'
import { Button, Card, EmptyState, ErrorMessage, Select, StatusBadge, TextInput } from '../../components/ui'
import { formatDateTime } from '../../utils/dates'

type Visit = {
  id: number
  monsterId: number
  monsterName: string
  customerName: string
  visitAt: string
  durationMin: number
  guests: number
  status: 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'DONE'
  note: string | null
}

type Slots = { visitingFrom: string; visitingUntil: string; closedDays: string[]; slots: string[] }

const STATUS_FOR_BADGE: Record<Visit['status'], string> = { REQUESTED: 'PENDING', CONFIRMED: 'ACCEPTED', CANCELLED: 'CANCELLED', DONE: 'DONE' }

function BookVisit() {
  const qc = useQueryClient()
  const { data: monsters } = useQuery({ queryKey: ['my-monsters-for-visits'], queryFn: () => apiFetch('/monsters?mine=1') as Promise<{ id: number; name: string; status: string }[]> })
  const { data: slots } = useQuery({ queryKey: ['visit-slots'], queryFn: () => apiFetch('/visits/slots') as Promise<Slots> })
  const [form, setForm] = useState({ monsterId: '', date: '', time: '', durationMin: '30', guests: '1', note: '' })
  const book = useMutation({
    mutationFn: () =>
      apiFetch('/visits', {
        method: 'POST',
        body: {
          monsterId: Number(form.monsterId),
          visitAt: `${form.date}T${form.time}`,
          durationMin: Number(form.durationMin),
          guests: Number(form.guests),
          note: form.note || undefined,
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['visits'] }),
  })
  const here = (monsters ?? []).filter((m) => m.status === 'IN_RESIDENCE')

  return (
    <Card title="👋 Book a visit">
      {here.length === 0 ? (
        <p className="muted">None of your monsters are staying with us right now.</p>
      ) : (
        <>
          {slots && (
            <p className="muted">
              Visiting hours {slots.visitingFrom}–{slots.visitingUntil}
              {slots.closedDays.length > 0 && `, closed on ${slots.closedDays.join(', ')}`}.
            </p>
          )}
          <Select label="Who are you visiting?" placeholder="--" value={form.monsterId} onChange={(e) => setForm({ ...form, monsterId: e.target.value })} options={here.map((m) => ({ value: m.id, label: m.name }))} />
          <TextInput label="Day" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Select label="Time" placeholder="--" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} options={(slots?.slots ?? []).map((s) => ({ value: s, label: s }))} />
          <Select
            label="How long?"
            value={form.durationMin}
            onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
            options={[
              { value: 30, label: '30 minutes' },
              { value: 60, label: '1 hour' },
              { value: 90, label: '1½ hours' },
              { value: 120, label: '2 hours' },
            ]}
          />
          <TextInput label="Guests" type="number" min={1} max={4} value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })} />
          <TextInput label="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Bringing his favourite blanket" />
          <Button variant="primary" loading={book.isPending} disabled={!form.monsterId || !form.date || !form.time} onClick={() => book.mutate()}>
            Request visit
          </Button>
          {book.isSuccess && <p className="success">📨 Requested! The front desk will confirm.</p>}
          <ErrorMessage error={book.error} />
        </>
      )}
    </Card>
  )
}

function VisitList({ staff }: { staff: boolean }) {
  const qc = useQueryClient()
  const { data: visits } = useQuery({ queryKey: ['visits'], queryFn: () => apiFetch('/visits') as Promise<Visit[]> })
  const act = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'confirm' | 'cancel' | 'done' }) => apiFetch(`/visits/${id}/${action}`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['visits'] }),
  })
  if (visits?.length === 0) return <EmptyState title={staff ? 'No visits this week' : 'No visits booked'} icon="🏰" />
  return (
    <Card title={staff ? '📋 Visits this week' : '📋 My visits'}>
      <table className="table">
        <tbody>
          {visits?.map((v) => (
            <tr key={v.id}>
              <td>{formatDateTime(v.visitAt)}</td>
              <td>
                <b>{v.monsterName}</b>
                {staff && <span className="muted"> ← {v.customerName}</span>}
              </td>
              <td>
                {v.durationMin} min · {v.guests} guest(s)
              </td>
              <td>
                <StatusBadge status={STATUS_FOR_BADGE[v.status]} />
              </td>
              <td>
                {staff && v.status === 'REQUESTED' && <Button onClick={() => act.mutate({ id: v.id, action: 'confirm' })}>Confirm</Button>}
                {staff && v.status === 'CONFIRMED' && <Button onClick={() => act.mutate({ id: v.id, action: 'done' })}>Done</Button>}
                {(v.status === 'REQUESTED' || v.status === 'CONFIRMED') && (
                  <Button variant="link" onClick={() => act.mutate({ id: v.id, action: 'cancel' })}>
                    cancel
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

export default function VisitsPage() {
  const { user } = useAuth()
  const staff = hasRole(user, 'ADMIN', 'FRONT_DESK', 'KEEPER')
  return (
    <div className="page">
      <h2>👋 Visits</h2>
      {!staff && <BookVisit />}
      <VisitList staff={staff} />
    </div>
  )
}
