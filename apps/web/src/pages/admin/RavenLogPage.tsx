// Raven Post log (legacy /api/ravens). Raven Post is deprecated (ADR-007) but
// customers who prefer ravens still get them, so the front desk asked to see them.
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../api'
import { DataTable, ErrorMessage, Spinner, type Column } from '../../components/ui'
import { formatDateTime } from '../../utils/dates'

type Raven = { id: number; customer_id: number; first_name: string | null; last_name: string | null; subject: string; body: string; status: string; created_at: string; sent_at: string | null }

const columns: Column<Raven>[] = [
  { key: 'when', header: 'Sent', render: (r) => formatDateTime(r.sent_at ?? r.created_at), sortValue: (r) => r.created_at },
  { key: 'to', header: 'To', render: (r) => `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim(), sortValue: (r) => r.last_name },
  { key: 'subject', header: 'Subject', render: (r) => r.subject },
  { key: 'status', header: '', render: (r) => (r.status === 'SENT' ? '🐦' : '⏳'), width: '40px' },
]

export default function RavenLogPage() {
  const [q, setQ] = useState('')
  const { data, error, isLoading } = useQuery({ queryKey: ['ravens'], queryFn: () => apiFetch('/ravens') as Promise<Raven[]> })
  const rows = (data ?? []).filter((r) => !q || `${r.subject} ${r.first_name} ${r.last_name}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="page">
      <h2>🐦 Raven Post log</h2>
      <p className="muted">The last 200 ravens. Raven Post is deprecated; new messages go through notifications and fly from there.</p>
      <input className="search" placeholder="Filter..." value={q} onChange={(e) => setQ(e.target.value)} />
      <ErrorMessage error={error} />
      {isLoading ? <Spinner /> : <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} initialSort={{ key: 'when', dir: 'desc' }} />}
    </div>
  )
}
