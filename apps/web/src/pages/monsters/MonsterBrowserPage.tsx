import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../api'
import { DataTable, ErrorMessage, Spinner, StatusBadge, type Column } from '../../components/ui'
import { useDebounced } from '../../hooks/useDebounced'
import type { Species } from '../../types/species'
import DangerLevel from '../species/DangerLevel'

type Row = {
  id: number
  name: string
  status: string
  age: number | null
  species: { id: number; name: string; dangerLevel: number } | null
  lair: { id: number; name: string } | null
  ownerName: string | null
  owner: { id: number } | null
}

type Filters = { q: string; speciesId: string; status: string; lairId: string; unhoused: boolean; ownerless: boolean }

const EMPTY: Filters = { q: '', speciesId: '', status: '', lairId: '', unhoused: false, ownerless: false }

const columns: Column<Row>[] = [
  {
    key: 'name',
    header: 'Name',
    render: (m) => <Link to={`/monsters/${m.id}/profile`}>{m.name}</Link>,
    sortValue: (m) => m.name,
  },
  { key: 'species', header: 'Species', render: (m) => m.species?.name ?? <i>unknown</i>, sortValue: (m) => m.species?.name ?? 'zzz' },
  { key: 'danger', header: 'Danger', render: (m) => (m.species ? <DangerLevel level={m.species.dangerLevel} /> : null), sortValue: (m) => m.species?.dangerLevel ?? 0 },
  { key: 'age', header: 'Age', render: (m) => m.age ?? '?', sortValue: (m) => m.age },
  { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} />, sortValue: (m) => m.status },
  { key: 'lair', header: 'Lair', render: (m) => (m.lair ? <Link to={`/lairs/${m.lair.id}`}>{m.lair.name}</Link> : '—'), sortValue: (m) => m.lair?.name ?? null },
  {
    key: 'owner',
    header: 'Owner',
    render: (m) => (m.owner ? <Link to={`/customers/${m.owner.id}`}>{m.ownerName}</Link> : <span className="muted">castle</span>),
    sortValue: (m) => m.ownerName,
  },
]

export default function MonsterBrowserPage() {
  const [f, setF] = useState<Filters>(EMPTY)
  const q = useDebounced(f.q, 300)
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (f.speciesId) params.set('speciesId', f.speciesId)
  if (f.status) params.set('status', f.status)
  if (f.lairId) params.set('lairId', f.lairId)
  if (f.unhoused) params.set('unhoused', '1')
  if (f.ownerless) params.set('ownerless', '1')

  const { data, isLoading, error } = useQuery({ queryKey: ['monster-browser', params.toString()], queryFn: () => apiFetch(`/monster-profiles?${params}`) as Promise<Row[]> })
  const { data: species } = useQuery({ queryKey: ['species'], queryFn: () => apiFetch('/species') as Promise<Species[]> })
  const { data: lairs } = useQuery({ queryKey: ['lairs'], queryFn: () => apiFetch('/lairs') as Promise<{ id: number; name: string }[]> })

  return (
    <div className="page">
      <h2>🐉 Monster browser</h2>
      <p className="muted">
        Filters, sorting and links to the full profile. <Link to="/monsters">Classic list</Link>
      </p>
      <div className="toolbar wrap">
        <input className="search" placeholder="Name..." value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        <select value={f.speciesId} onChange={(e) => setF({ ...f, speciesId: e.target.value })}>
          <option value="">Any species</option>
          {species?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="">Any status</option>
          {['IN_RESIDENCE', 'HOME', 'AVAILABLE', 'HIRED', 'RETIRED'].map((s) => (
            <option key={s} value={s}>
              {s.toLowerCase().replace('_', ' ')}
            </option>
          ))}
        </select>
        <select value={f.lairId} onChange={(e) => setF({ ...f, lairId: e.target.value, unhoused: false })}>
          <option value="">Any lair</option>
          {lairs?.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <label>
          <input type="checkbox" checked={f.unhoused} onChange={(e) => setF({ ...f, unhoused: e.target.checked, lairId: '' })} /> no lair
        </label>
        <label>
          <input type="checkbox" checked={f.ownerless} onChange={(e) => setF({ ...f, ownerless: e.target.checked })} /> castle residents
        </label>
        <button onClick={() => setF(EMPTY)}>Reset</button>
      </div>
      <ErrorMessage error={error} />
      {isLoading ? <Spinner /> : <DataTable rows={data ?? []} columns={columns} rowKey={(m) => m.id} initialSort={{ key: 'name', dir: 'asc' }} pageSize={30} />}
      {data && <p className="muted">{data.length} monsters</p>}
    </div>
  )
}
