// Owners: ask for a stay, see your requests.
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../api'
import { Button, Card, ErrorMessage, Select, StatusBadge, TextArea, TextInput } from '../../components/ui'
import { formatDay } from '../../utils/dates'
import type { BookingRequest } from './types'

type MyMonster = { id: number; name: string; species: string; status: string }

const REASONS = [
  { value: 'BOARDING', label: '🏖️ Boarding (I am going away)' },
  { value: 'TREATMENT', label: '🩹 Treatment (adventurer-related injury)' },
  { value: 'THERAPY', label: '🛋️ Therapy (fears, trauma, hoarding...)' },
]

export default function BookStayPage() {
  const qc = useQueryClient()
  const { data: monsters } = useQuery({ queryKey: ['my-monsters-for-booking'], queryFn: () => apiFetch('/monsters?mine=1') as Promise<MyMonster[]> })
  const { data: requests } = useQuery({ queryKey: ['booking-requests', 'mine'], queryFn: () => apiFetch('/booking-requests') as Promise<BookingRequest[]> })
  const [form, setForm] = useState({ monsterId: '', reason: 'BOARDING', startDate: '', endDate: '', message: '' })

  const send = useMutation({
    mutationFn: () =>
      apiFetch('/booking-requests', {
        method: 'POST',
        body: { monsterId: Number(form.monsterId), reason: form.reason, startDate: form.startDate, endDate: form.endDate, message: form.message || undefined },
      }) as Promise<BookingRequest>,
    onSuccess: () => {
      setForm({ monsterId: '', reason: 'BOARDING', startDate: '', endDate: '', message: '' })
      qc.invalidateQueries({ queryKey: ['booking-requests'] })
    },
  })
  const cancel = useMutation({
    mutationFn: (id: number) => apiFetch(`/booking-requests/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['booking-requests'] }),
  })

  const athome = (monsters ?? []).filter((m) => m.status === 'HOME')
  const datesOk = form.startDate && form.endDate && form.endDate > form.startDate

  return (
    <div className="page">
      <h2>📅 Book a stay</h2>
      <Card title="Request a stay">
        <Select
          label="Which monster?"
          value={form.monsterId}
          onChange={(e) => setForm({ ...form, monsterId: e.target.value })}
          placeholder="--"
          options={athome.map((m) => ({ value: m.id, label: `${m.name} (${m.species})` }))}
          hint={athome.length === 0 ? 'All your monsters are already with us, or you have none registered.' : undefined}
        />
        <Select label="Why?" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} options={REASONS} />
        <TextInput label="Arrival" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        <TextInput
          label="Pickup"
          type="date"
          value={form.endDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          error={form.endDate && form.startDate && !datesOk ? 'Pickup must be after arrival' : null}
        />
        <TextArea label="Anything we should know?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        <Button variant="primary" loading={send.isPending} disabled={!form.monsterId || !datesOk} onClick={() => send.mutate()}>
          Send request
        </Button>
        {send.data && <p className="success">{send.data.status === 'APPROVED' ? '✅ Booked straight away!' : '📨 Request sent. The front desk will confirm.'}</p>}
        <ErrorMessage error={send.error} />
      </Card>

      <Card title="My requests">
        <table className="table">
          <tbody>
            {requests?.map((r) => (
              <tr key={r.id}>
                <td>{r.monsterName}</td>
                <td>{r.reason.toLowerCase()}</td>
                <td>
                  {formatDay(r.startDate)} → {formatDay(r.endDate)}
                </td>
                <td>
                  <StatusBadge status={r.status === 'APPROVED' ? 'ACCEPTED' : r.status === 'DECLINED' ? 'REJECTED' : r.status} />
                  {r.declineNote && <span className="muted"> {r.declineNote}</span>}
                </td>
                <td>{r.status === 'PENDING' && <Button variant="link" onClick={() => cancel.mutate(r.id)}>cancel</Button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
