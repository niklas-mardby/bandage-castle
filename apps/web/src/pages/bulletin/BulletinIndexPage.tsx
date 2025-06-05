import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { hasRole } from '@bandage/shared'
import { apiFetch } from '../../api'
import { useAuth } from '../../auth/AuthProvider'
import { formatDay } from '../../utils/dates'
import { bulletinPath, type BulletinSummary } from './types'

export default function BulletinIndexPage() {
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('')
  const canWrite = hasRole(user, 'SCRIBE', 'ADMIN')
  const { data: pages, isLoading } = useQuery({
    queryKey: ['bulletin', kind, q],
    queryFn: () => apiFetch(`/bulletin?${new URLSearchParams({ ...(kind ? { kind } : {}), ...(q ? { q } : {}) })}`) as Promise<BulletinSummary[]>,
  })

  return (
    <div className="page">
      <h2>📜 The Bulletin</h2>
      <p className="muted">News, notices and how-tos from around the castle.</p>
      <div className="toolbar">
        <input className="search" placeholder="Search the Bulletin..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">Everything</option>
          <option value="POST">📰 News posts</option>
          <option value="PAGE">📘 Pages</option>
        </select>
        {canWrite && <Link to="/bulletin/new">✍️ Write something</Link>}
      </div>
      {isLoading && <p>Unrolling the scrolls... 📜</p>}
      {pages?.map((p) => (
        <article key={p.id} className={`card wide bulletin-item ${p.status === 'DRAFT' ? 'draft' : ''}`}>
          <h3>
            {p.pinned && '📌 '}
            <Link to={bulletinPath(p)}>{p.title}</Link> {p.status === 'DRAFT' && <span className="badge badge-warn">draft</span>}
          </h3>
          <p className="muted">
            {p.kind === 'PAGE' ? '📘 page' : '📰 post'} · {p.author?.displayName ?? 'unknown'} · {formatDay(p.publishedAt ?? p.updatedAt)}
          </p>
          <p>{p.excerpt}</p>
        </article>
      ))}
      {pages?.length === 0 && <p className="muted">Nothing on the notice board.</p>}
    </div>
  )
}
