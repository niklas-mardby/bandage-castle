import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toGoldString } from '@bandage/shared'
import { apiFetch } from '../../api'
import { DataTable, ErrorMessage, Spinner, type Column } from '../../components/ui'
import { useDebounced } from '../../hooks/useDebounced'
import { CONTACT_ICON, type CustomerSummary } from './types'

const columns: Column<CustomerSummary>[] = [
  { key: 'name', header: 'Name', render: (c) => <Link to={`/customers/${c.id}`}>{c.name}</Link>, sortValue: (c) => `${c.lastName} ${c.firstName}` },
  { key: 'contact', header: 'Contact', render: (c) => (c.contactPref ? `${CONTACT_ICON[c.contactPref]} ${c.contactPref}` : '—') },
  { key: 'email', header: 'Email', render: (c) => c.email ?? '—' },
  { key: 'monsters', header: '🐉', render: (c) => c.monsterCount, sortValue: (c) => c.monsterCount, width: '60px' },
  { key: 'stays', header: '🛏️', render: (c) => c.stayCount, sortValue: (c) => c.stayCount, width: '60px' },
  {
    key: 'owed',
    header: 'Owes',
    render: (c) => (c.owedGold > 0 ? <span className="warn-text">{toGoldString(c.owedGold)}</span> : '—'),
    sortValue: (c) => c.owedGold,
  },
  { key: 'login', header: 'Login', render: (c) => (c.userId ? '✅' : ''), width: '60px' },
]

export default function CustomerListPage() {
  const [q, setQ] = useState('')
  const debounced = useDebounced(q, 300)
  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', debounced],
    queryFn: () => apiFetch(`/customers${debounced ? `?q=${encodeURIComponent(debounced)}` : ''}`) as Promise<CustomerSummary[]>,
  })

  return (
    <div className="page">
      <h2>🧾 Customers</h2>
      <div className="toolbar">
        <input className="search" placeholder="Search by name or email..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Link to="/customers/new">+ New customer</Link>
      </div>
      <ErrorMessage error={error} />
      {isLoading ? <Spinner /> : <DataTable rows={data ?? []} columns={columns} rowKey={(c) => c.id} initialSort={{ key: 'name', dir: 'asc' }} />}
    </div>
  )
}
