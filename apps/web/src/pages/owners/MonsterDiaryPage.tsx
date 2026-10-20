import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../api'
import { Card, ErrorMessage, Spinner, StatusBadge } from '../../components/ui'
import { formatDay } from '../../utils/dates'
import { ISSUE_LABEL, type Issue } from '../therapy/types'

type Diary = {
  id: number
  name: string
  age: number | null
  species: { name: string; diet: string } | null
  status: string
  quirks: string | null
  lair: { name: string; wing: string } | null
  mealsServedToday: number
  stays: { id: number; reason: string; status: string; startDate: string | null; expectedPickup: string | null; checkedInAt: string | null; checkedOutAt: string | null }[]
  health: { date: string; summary: string; treatments: { name: string; status: string }[] }[]
  therapy: { issue: Issue; status: string; sessions: number }[]
}

const REASON_ICON: Record<string, string> = { BOARDING: '🏖️', TREATMENT: '🩹', THERAPY: '🛋️', SURRENDER: '🦴' }

export default function MonsterDiaryPage() {
  const { id } = useParams()
  const { data: d, error, isLoading } = useQuery({ queryKey: ['diary', Number(id)], queryFn: () => apiFetch(`/my/monsters/${id}/diary`) as Promise<Diary> })

  if (isLoading) return <Spinner />
  if (error || !d) return <ErrorMessage error={error ?? 'Not found'} />

  const current = d.stays.find((s) => s.status === 'CHECKED_IN')

  return (
    <div className="page">
      <Link to="/">← Home</Link>
      <div className="monster-header">
        <img src={`/api/monsters/${d.id}/photo`} alt={d.name} width={160} />
        <div>
          <h2>📔 {d.name}'s diary</h2>
          <p>
            {d.species?.name} {d.age !== null && `· ${d.age} years old`} <StatusBadge status={d.status} />
          </p>
          {d.quirks && <p className="muted">{d.quirks}</p>}
        </div>
      </div>

      {current ? (
        <Card title="🏰 Staying with us">
          <p>
            {REASON_ICON[current.reason]} {current.reason.toLowerCase()} since {formatDay(current.checkedInAt ?? current.startDate)}, pickup on <b>{formatDay(current.expectedPickup)}</b>.
          </p>
          {d.lair && (
            <p>
              Sleeping in <b>{d.lair.name}</b> ({d.lair.wing.replace('_', ' ').toLowerCase()}).
            </p>
          )}
          <p>
            🍖 {d.mealsServedToday} meal(s) served today{d.species && <> ({d.species.diet.toLowerCase()})</>}.
          </p>
          <p>
            <Link to="/visits">👋 Book a visit →</Link>
          </p>
        </Card>
      ) : (
        <Card title="🏡 At home">
          <p>
            {d.name} isn't staying with us right now. <Link to="/book">Book a stay →</Link>
          </p>
        </Card>
      )}

      {d.health.length > 0 && (
        <Card title="🩺 Health">
          <ul>
            {d.health.map((h, i) => (
              <li key={i}>
                {formatDay(h.date)}: {h.summary}
                {h.treatments.length > 0 && <span className="muted"> ({h.treatments.map((t) => `${t.name}${t.status === 'ONGOING' ? ' — ongoing' : ''}`).join(', ')})</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {d.therapy.length > 0 && (
        <Card title="🛋️ Therapy">
          <ul>
            {d.therapy.map((t, i) => (
              <li key={i}>
                {ISSUE_LABEL[t.issue]}: {t.sessions} session(s), {t.status.toLowerCase()}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="🛏️ All stays">
        <table className="table">
          <tbody>
            {d.stays.map((s) => (
              <tr key={s.id}>
                <td>{REASON_ICON[s.reason]}</td>
                <td>{s.reason.toLowerCase()}</td>
                <td>
                  {formatDay(s.startDate)} → {formatDay(s.checkedOutAt ?? s.expectedPickup)}
                </td>
                <td>
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
