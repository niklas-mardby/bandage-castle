// A keeper's day on one screen: meals still to serve, medicine round, my tickets, visits.
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../api'
import { useAuth } from '../../auth/AuthProvider'
import { Card, EmptyState, Spinner, StatusBadge } from '../../components/ui'
import { formatDateTime } from '../../utils/dates'

type Schedule = { entries: { time: string; monsterId: number; monsterName: string; lairName: string; food: string; portionKg: number; fed: boolean }[] }
type TicketPage = { items: { id: number; title: string; priority: string; status: string; dueDate: string | null }[] }
type Visit = { id: number; monsterName: string; customerName: string; visitAt: string; status: string; guests: number }

export default function MyDayPage() {
  const { user } = useAuth()
  const { data: schedule } = useQuery({ queryKey: ['feeding-schedule', 'today'], queryFn: () => apiFetch('/feeding/schedule') as Promise<Schedule> })
  const { data: tickets } = useQuery({ queryKey: ['tickets', 'mine-open'], queryFn: () => apiFetch('/tickets?mine=true&take=50') as Promise<TicketPage> })
  const { data: prescriptions } = useQuery({ queryKey: ['prescriptions', 'active'], queryFn: () => apiFetch('/medical/prescriptions/active') as Promise<unknown[]> })
  const { data: visits } = useQuery({ queryKey: ['visits'], queryFn: () => apiFetch('/visits') as Promise<Visit[]> })

  if (!schedule) return <Spinner label="Lighting the lanterns..." />

  const nowHHMM = new Date().toTimeString().slice(0, 5)
  const due = schedule.entries.filter((e) => !e.fed && e.time <= nowHHMM)
  const later = schedule.entries.filter((e) => !e.fed && e.time > nowHHMM)
  const open = (tickets?.items ?? []).filter((t) => t.status !== 'DONE')
  const todaysVisits = (visits ?? []).filter((v) => v.visitAt.slice(0, 10) === new Date().toISOString().slice(0, 10) && v.status !== 'CANCELLED')

  return (
    <div className="page">
      <h2>☀️ {user?.name?.split(' ')[0] ?? 'Keeper'}'s day</h2>
      <div className="cards">
        <Card title={`🍖 Meals due now (${due.length})`}>
          {due.length === 0 ? (
            <p className="muted">Nobody is hungry. For now.</p>
          ) : (
            <ul>
              {due.slice(0, 12).map((e) => (
                <li key={`${e.monsterId}-${e.time}`}>
                  {e.time} <b>{e.monsterName}</b> ({e.lairName}): {e.portionKg} kg {e.food}
                </li>
              ))}
            </ul>
          )}
          <p className="muted">{later.length} more later today.</p>
          <Link to="/feeding">Feeding schedule →</Link>
        </Card>
        <Card title="🧪 Medicine">
          <p>{prescriptions?.length ?? 0} active prescriptions.</p>
          <Link to="/rounds">Start the round →</Link>
        </Card>
        <Card title={`👋 Visitors today (${todaysVisits.length})`}>
          {todaysVisits.length === 0 ? (
            <p className="muted">No visitors. Enjoy the quiet.</p>
          ) : (
            <ul>
              {todaysVisits.map((v) => (
                <li key={v.id}>
                  {formatDateTime(v.visitAt).slice(-5)} {v.customerName} → <b>{v.monsterName}</b> ({v.guests})
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Card title={`🎫 My open tickets (${open.length})`}>
        {open.length === 0 ? (
          <EmptyState title="No tickets for you" icon="🧹" />
        ) : (
          <ul>
            {open.map((t) => (
              <li key={t.id}>
                <Link to={`/tickets/${t.id}`}>{t.title}</Link> <StatusBadge status={t.status} /> <span className="muted">{t.priority.toLowerCase()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
