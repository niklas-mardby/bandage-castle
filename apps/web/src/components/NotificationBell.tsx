import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../api'
import { fromNow } from '../utils/dates'

type Notification = { id: number; title: string; body: string; link: string | null; readAt: string | null; createdAt: string }
type NotificationList = { items: Notification[]; unread: number }

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiFetch('/notifications') as Promise<NotificationList>,
    refetchInterval: 30_000,
  })
  const markAll = useMutation({
    mutationFn: () => apiFetch('/notifications/read-all', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
  const markOne = useMutation({
    mutationFn: (id: number) => apiFetch(`/notifications/${id}/read`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unread = data?.unread ?? 0

  return (
    <span className="bell">
      <button className="bell-button" onClick={() => setOpen(!open)} title="Notifications">
        🔔{unread > 0 && <span className="bell-count">{unread}</span>}
      </button>
      {open && (
        <div className="bell-dropdown">
          <div className="bell-header">
            <b>Notifications</b>
            {unread > 0 && (
              <button className="link" onClick={() => markAll.mutate()}>
                mark all read
              </button>
            )}
          </div>
          {data?.items.length === 0 && <p className="muted">Nothing new. The castle is quiet. 🦇</p>}
          {data?.items.map((n) => (
            <div key={n.id} className={`bell-item ${n.readAt ? 'read' : ''}`} onClick={() => !n.readAt && markOne.mutate(n.id)}>
              <b>{n.title}</b>
              <p>{n.body}</p>
              <span className="muted">{fromNow(n.createdAt)}</span>
              {n.link && (
                <Link to={n.link} onClick={() => setOpen(false)}>
                  open →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </span>
  )
}
