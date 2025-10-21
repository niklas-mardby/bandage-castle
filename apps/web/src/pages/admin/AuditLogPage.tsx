import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { apiFetch } from '../../api'
import { formatDateTime } from '../../utils/dates'

type Entry = {
  id: number
  entity: string
  entityId: string
  action: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  createdAt: string
  actor: { id: number; displayName: string | null; email: string } | null
}

const ENTITY_ICON: Record<string, string> = { ticket: '🎫', user: '👤', lair: '🏚️', flag: '🚩' }

function Changes({ before, after }: { before: Entry['before']; after: Entry['after'] }) {
  const keys = Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]))
  if (keys.length === 0) return <span className="muted">no changes</span>
  return (
    <ul className="changes">
      {keys.map((k) => (
        <li key={k}>
          <b>{k}</b>: <span className="old">{JSON.stringify(before?.[k] ?? null)}</span> → <span className="new">{JSON.stringify(after?.[k] ?? null)}</span>
        </li>
      ))}
    </ul>
  )
}

export default function AuditLogPage() {
  const [entity, setEntity] = useState('')
  const [entityId, setEntityId] = useState('')
  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    queryKey: ['audit', entity, entityId],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      apiFetch(`/audit?${new URLSearchParams({ entity, entityId, take: '50', ...(pageParam ? { before: String(pageParam) } : {}) })}`) as Promise<Entry[]>,
    getNextPageParam: (last) => (last.length === 50 ? last[last.length - 1].id : undefined),
  })
  const entries = data?.pages.flat() ?? []

  return (
    <div className="page">
      <h2>🕵️ Audit log</h2>
      <p className="muted">Who changed what. Currently covers tickets, users, lairs and feature flags.</p>
      <div className="toolbar">
        <select value={entity} onChange={(e) => setEntity(e.target.value)}>
          <option value="">All</option>
          {Object.entries(ENTITY_ICON).map(([k, icon]) => (
            <option key={k} value={k}>
              {icon} {k}
            </option>
          ))}
        </select>
        <input className="small" placeholder="id" value={entityId} onChange={(e) => setEntityId(e.target.value)} />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>When</th>
            <th>Who</th>
            <th>What</th>
            <th>Changes</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <td>{formatDateTime(e.createdAt)}</td>
              <td>{e.actor?.displayName ?? e.actor?.email ?? 'system'}</td>
              <td>
                {ENTITY_ICON[e.entity] ?? '📄'} {e.entity} #{e.entityId} <span className="badge">{e.action}</span>
              </td>
              <td>
                <Changes before={e.before} after={e.after} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasNextPage && (
        <button disabled={isFetching} onClick={() => fetchNextPage()}>
          Older entries
        </button>
      )}
    </div>
  )
}
