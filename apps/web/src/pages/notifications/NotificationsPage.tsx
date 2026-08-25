import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../api'
import { Button, EmptyState, Spinner } from '../../components/ui'
import { formatDateTime, fromNow } from '../../utils/dates'

type Notification = { id: number; title: string; body: string; link: string | null; channel: string; readAt: string | null; createdAt: string }

const CHANNEL_ICON: Record<string, string> = { IN_APP: '🔔', RAVEN: '🐦', CRYSTAL_BALL: '🔮', EMAIL: '📧' }

export default function NotificationsPage() {
  const qc = useQueryClient()
  const [unreadOnly, setUnreadOnly] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'page', unreadOnly],
    queryFn: () => apiFetch(`/notifications${unreadOnly ? '?unread=1' : ''}`) as Promise<{ items: Notification[]; unread: number }>,
  })
  const refresh = () => qc.invalidateQueries({ queryKey: ['notifications'] })
  const markAll = useMutation({ mutationFn: () => apiFetch('/notifications/read-all', { method: 'POST' }), onSuccess: refresh })
  const markOne = useMutation({ mutationFn: (id: number) => apiFetch(`/notifications/${id}/read`, { method: 'POST' }), onSuccess: refresh })

  return (
    <div className="page">
      <h2>🔔 Notifications</h2>
      <div className="toolbar">
        <label>
          <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} /> unread only
        </label>
        {data && data.unread > 0 && <Button onClick={() => markAll.mutate()}>Mark all {data.unread} as read</Button>}
      </div>
      {isLoading && <Spinner />}
      {data?.items.length === 0 && <EmptyState title="All caught up" icon="🦉" />}
      {data?.items.map((n) => (
        <div key={n.id} className={`card wide notification ${n.readAt ? 'read' : 'unread'}`}>
          <h4>
            {CHANNEL_ICON[n.channel] ?? '🔔'} {n.title}
          </h4>
          <p>{n.body}</p>
          <p className="muted" title={formatDateTime(n.createdAt)}>
            {fromNow(n.createdAt)}
            {n.link && (
              <>
                {' '}
                · <Link to={n.link}>open</Link>
              </>
            )}
            {!n.readAt && (
              <>
                {' '}
                ·{' '}
                <Button variant="link" onClick={() => markOne.mutate(n.id)}>
                  mark read
                </Button>
              </>
            )}
          </p>
        </div>
      ))}
    </div>
  )
}
