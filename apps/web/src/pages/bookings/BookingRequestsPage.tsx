// Front desk: approve or decline owners' booking requests.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../api'
import { Button, EmptyState, ErrorMessage, Modal, Spinner, StatusBadge, TextInput } from '../../components/ui'
import { formatDay, fromNow } from '../../utils/dates'
import type { BookingRequest } from './types'

export default function BookingRequestsPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('PENDING')
  const [declining, setDeclining] = useState<BookingRequest | null>(null)
  const [note, setNote] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['booking-requests', status],
    queryFn: () => apiFetch(`/booking-requests${status ? `?status=${status}` : ''}`) as Promise<BookingRequest[]>,
  })
  const refresh = () => qc.invalidateQueries({ queryKey: ['booking-requests'] })
  const approve = useMutation({ mutationFn: (id: number) => apiFetch(`/booking-requests/${id}/approve`, { method: 'POST', body: {} }), onSuccess: refresh })
  const decline = useMutation({
    mutationFn: () => apiFetch(`/booking-requests/${declining!.id}/decline`, { method: 'POST', body: { note } }),
    onSuccess: () => {
      setDeclining(null)
      setNote('')
      refresh()
    },
  })

  return (
    <div className="page">
      <h2>📨 Booking requests</h2>
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="PENDING">Waiting for us</option>
        <option value="APPROVED">Approved</option>
        <option value="DECLINED">Declined</option>
        <option value="">All</option>
      </select>
      {isLoading && <Spinner />}
      {data?.length === 0 && <EmptyState title="No requests" icon="📭" />}
      <ErrorMessage error={approve.error} />
      {data?.map((r) => (
        <div className="card wide" key={r.id}>
          <h4>
            {r.monsterName} · {r.reason.toLowerCase()} · {formatDay(r.startDate)} → {formatDay(r.endDate)} <StatusBadge status={r.status} />
          </h4>
          <p className="muted">
            from {r.customerName}, {fromNow(r.createdAt)}
          </p>
          {r.message && <p className="description">{r.message}</p>}
          {r.stayId && <Link to={`/stays/${r.stayId}`}>Stay #{r.stayId} →</Link>}
          {r.status === 'PENDING' && (
            <div className="toolbar">
              <Button variant="primary" loading={approve.isPending} onClick={() => approve.mutate(r.id)}>
                ✅ Approve
              </Button>
              <Button onClick={() => setDeclining(r)}>❌ Decline</Button>
            </div>
          )}
        </div>
      ))}
      <Modal
        open={declining !== null}
        title={`Decline ${declining?.monsterName}'s stay`}
        onClose={() => setDeclining(null)}
        footer={
          <Button variant="danger" disabled={note.trim().length < 3} loading={decline.isPending} onClick={() => decline.mutate()}>
            Decline
          </Button>
        }
      >
        <TextInput label="Reason (the owner sees this)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Fully booked that week, sorry!" />
      </Modal>
    </div>
  )
}
