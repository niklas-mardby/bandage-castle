import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { addMonths, format, parseISO } from 'date-fns'
import { apiFetch } from '../../api'
import { EmptyState, Spinner } from '../../components/ui'

type CalendarStay = {
  id: number
  reason: 'BOARDING' | 'TREATMENT' | 'THERAPY' | 'SURRENDER'
  status: string
  startDate: string
  expectedPickup: string | null
  checkedOutAt: string | null
  monster: { id: number; name: string; species: { name: string } | null }
}

type Calendar = { month: string; days: number; stays: CalendarStay[] }

const REASON_CLASS: Record<CalendarStay['reason'], string> = {
  BOARDING: 'cal-boarding',
  TREATMENT: 'cal-treatment',
  THERAPY: 'cal-therapy',
  SURRENDER: 'cal-surrender',
}

/** Day of the month (1-based) a date falls on, clamped to the month. */
function dayInMonth(iso: string | null, month: string, days: number, fallback: number) {
  if (!iso) return fallback
  const d = iso.slice(0, 10)
  if (d < `${month}-01`) return 1
  if (d > `${month}-${String(days).padStart(2, '0')}`) return days
  return Number(d.slice(8, 10))
}

export default function StayCalendarPage() {
  const navigate = useNavigate()
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const { data, isLoading } = useQuery({ queryKey: ['stay-calendar', month], queryFn: () => apiFetch(`/stays/calendar?month=${month}`) as Promise<Calendar> })
  const shift = (n: number) => setMonth(format(addMonths(parseISO(`${month}-01`), n), 'yyyy-MM'))
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="page">
      <h2>📅 Stay calendar</h2>
      <div className="toolbar">
        <button onClick={() => shift(-1)}>‹</button>
        <b>{format(parseISO(`${month}-01`), 'MMMM yyyy')}</b>
        <button onClick={() => shift(1)}>›</button>
        <Link to="/stays">List view</Link>
        <span className="legend">
          <span className="cal-boarding">boarding</span> <span className="cal-treatment">treatment</span> <span className="cal-therapy">therapy</span>{' '}
          <span className="cal-surrender">surrender</span>
        </span>
      </div>
      {isLoading && <Spinner />}
      {data && data.stays.length === 0 && <EmptyState title="Nobody booked this month" icon="📭" />}
      {data && data.stays.length > 0 && (
        <div className="calendar" style={{ gridTemplateColumns: `180px repeat(${data.days}, 1fr)` }}>
          <div className="cal-head" />
          {Array.from({ length: data.days }, (_, i) => {
            const d = `${month}-${String(i + 1).padStart(2, '0')}`
            return (
              <div key={d} className={`cal-head ${d === today ? 'cal-today' : ''}`}>
                {i + 1}
              </div>
            )
          })}
          {data.stays.map((s) => {
            const from = dayInMonth(s.startDate, month, data.days, 1)
            const to = dayInMonth(s.checkedOutAt ?? s.expectedPickup, month, data.days, data.days)
            return (
              <div className="cal-row" key={s.id} style={{ display: 'contents' }}>
                <div className="cal-name" title={s.monster.species?.name}>
                  <Link to={`/stays/${s.id}`}>{s.monster.name}</Link>
                </div>
                <div
                  className={`cal-bar ${REASON_CLASS[s.reason]} ${s.status === 'BOOKED' ? 'cal-booked' : ''}`}
                  style={{ gridColumn: `${from + 1} / ${to + 2}` }}
                  title={`${s.monster.name}: ${s.reason.toLowerCase()}, ${s.startDate.slice(0, 10)} → ${(s.expectedPickup ?? '?').slice(0, 10)}`}
                  onClick={() => navigate(`/stays/${s.id}`)}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
