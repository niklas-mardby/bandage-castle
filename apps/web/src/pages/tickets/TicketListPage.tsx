import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../api'
import { formatShortDate, userName } from '../../utils/format'
import { CATEGORY_ICON, PRIORITY_ICON, STATUS_LABEL, type Ticket } from './types'

type Page = { items: Ticket[]; nextCursor: number | null }

export default function TicketListPage() {
  const [status, setStatus] = useState('')
  const [mine, setMine] = useState(false)
  const [priority, setPriority] = useState('')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [nextCursor, setNextCursor] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const query = (cursor?: number) => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (priority) params.set('priority', priority)
    if (mine) params.set('mine', 'true')
    if (cursor) params.set('cursor', String(cursor))
    return `/tickets?${params.toString()}`
  }

  // first page whenever the filters change
  useEffect(() => {
    setLoading(true)
    apiFetch(query())
      .then((page: Page) => {
        setTickets(page.items)
        setNextCursor(page.nextCursor)
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, mine, priority])

  const loadMore = async () => {
    if (!nextCursor) return
    setLoading(true)
    const page: Page = await apiFetch(query(nextCursor))
    setTickets((prev) => [...prev, ...page.items])
    setNextCursor(page.nextCursor)
    setLoading(false)
  }

  return (
    <div className="page">
      <h2>🎫 Tickets</h2>
      <div className="toolbar">
        <Link to="/tickets/new">+ New ticket</Link>
        <Link to="/tickets/board">🗂️ Board</Link>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">Any priority</option>
          {Object.entries(PRIORITY_ICON).map(([p, icon]) => (
            <option key={p} value={p}>
              {icon} {p.toLowerCase()}
            </option>
          ))}
        </select>
        <label>
          <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> assigned to me
        </label>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th />
            <th>Title</th>
            <th>Status</th>
            <th>Assignee</th>
            <th>Created</th>
            <th>Due</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} className={t.status === 'DONE' ? 'done' : ''}>
              <td>{t.id}</td>
              <td title={`${t.priority} / ${t.category}`}>
                {PRIORITY_ICON[t.priority]} {CATEGORY_ICON[t.category]}
              </td>
              <td>
                <Link to={`/tickets/${t.id}`}>{t.title}</Link>
                {t._count && t._count.comments > 0 && <span className="muted"> 💬{t._count.comments}</span>}
              </td>
              <td>{STATUS_LABEL[t.status]}</td>
              <td>{userName(t.assignee)}</td>
              <td>{formatShortDate(t.createdAt)}</td>
              <td>{formatShortDate(t.dueDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && <p>Loading...</p>}
      {!loading && tickets.length === 0 && <p className="muted">No tickets. The castle is in perfect order. (Suspicious.)</p>}
      {nextCursor && !loading && <button onClick={loadMore}>Load more</button>}
    </div>
  )
}
