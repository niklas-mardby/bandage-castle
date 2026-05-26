import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toGoldString } from '@bandage/shared'
import { apiFetch } from '../../api'
import { Card, ErrorMessage, Spinner, StatusBadge, Tabs } from '../../components/ui'
import { formatDay } from '../../utils/dates'
import DangerLevel from '../species/DangerLevel'
import { ISSUE_LABEL, type Issue } from '../therapy/types'

type Profile = {
  id: number
  name: string
  status: string
  birthDate: string | null
  age: number | null
  temperament: string | null
  quirks: string | null
  history: string | null
  legacySpeciesText: string | null
  species: { id: number; name: string; slug: string; dangerLevel: number; diet: string; mealsPerDay: number; portionKg: number } | null
  owner: { id: number; title: string | null; firstName: string | null; lastName: string | null; contactPref: string | null } | null
  currentLair: { id: number; name: string; wing: string } | null
  lairHistory: { id: number; lair: { id: number; name: string }; assignedAt: string; releasedAt: string | null }[]
  stays: { id: number; reason: string; status: string; startDate: string | null; expectedPickup: string | null; checkedOutAt: string | null }[]
  medical: { records: number; ongoingTreatments: string[]; lastVisit: string | null; prescriptions: { id: number; remedy: string; dosage: string; frequency: string; endDate: string | null }[] }
  therapy: { id: number; issue: Issue; status: string; startedAt: string; endedAt: string | null; sessions: number }[]
  hiring: { listings: { id: number; title: string; status: string; availableFrom: string; feeGold: number }[]; contracts: { id: number; reference: string; signedAt: string | null; fee: number }[] }
  weights: { date: string; kg: number }[]
  tickets: { id: number; title: string; status: string; createdAt: string }[]
}

type Tab = 'stays' | 'care' | 'lairs' | 'hiring' | 'tickets'

export default function MonsterProfilePage() {
  const { id } = useParams()
  const [tab, setTab] = useState<Tab>('stays')
  const { data: m, error, isLoading } = useQuery({ queryKey: ['monster-profile', Number(id)], queryFn: () => apiFetch(`/monster-profiles/${id}`) as Promise<Profile> })

  if (isLoading) return <Spinner />
  if (error || !m) return <ErrorMessage error={error ?? 'Not found'} />

  const owner = m.owner ? [m.owner.title, m.owner.firstName, m.owner.lastName].filter(Boolean).join(' ') : null

  return (
    <div className="page">
      <Link to={`/monsters/${m.id}`}>← Classic page</Link>
      <div className="monster-header">
        <img src={`/api/monsters/${m.id}/photo`} alt={m.name} width={180} />
        <div>
          <h2>
            {m.name} <StatusBadge status={m.status} />
          </h2>
          <p>
            {m.species ? <Link to={`/species/${m.species.slug}`}>{m.species.name}</Link> : <i>{m.legacySpeciesText ?? 'unknown species'}</i>}
            {m.age !== null && ` · ${m.age} years old`} {m.birthDate && <span className="muted">(born {formatDay(m.birthDate)})</span>}
          </p>
          {m.species && <DangerLevel level={m.species.dangerLevel} />}
          <p>
            {owner ? (
              <>
                Owner: <Link to={`/customers/${m.owner!.id}`}>{owner}</Link> ({m.owner!.contactPref})
              </>
            ) : (
              'Castle resident (no owner)'
            )}
          </p>
          <p>{m.currentLair ? <>🏚️ Lives in <Link to={`/lairs/${m.currentLair.id}`}>{m.currentLair.name}</Link></> : <span className="muted">No lair right now</span>}</p>
        </div>
      </div>

      <div className="cards">
        <Card title="🧠 Personality">
          <p>
            <b>Temperament:</b> {m.temperament ?? '—'}
          </p>
          <p>
            <b>Quirks:</b> {m.quirks ?? '—'}
          </p>
          {m.history && <p className="muted">{m.history}</p>}
        </Card>
        <Card title="🩺 Health">
          <p>
            {m.medical.records} record(s), last visit {formatDay(m.medical.lastVisit)}
          </p>
          {m.medical.ongoingTreatments.length > 0 && <p className="warn-text">In treatment: {m.medical.ongoingTreatments.join(', ')}</p>}
          <Link to={`/monsters/${m.id}/medical`}>Medical history →</Link>
        </Card>
        {m.species && (
          <Card title="🍖 Diet">
            <p>{m.species.diet}</p>
            <p className="muted">
              {m.species.mealsPerDay} × {m.species.portionKg} kg a day
            </p>
          </Card>
        )}
      </div>

      <Tabs<Tab>
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'stays', label: '🛏️ Stays', count: m.stays.length },
          { key: 'care', label: '🛋️ Care', count: m.therapy.length + m.medical.prescriptions.length },
          { key: 'lairs', label: '🏚️ Lairs', count: m.lairHistory.length },
          { key: 'hiring', label: '🏛️ Hiring', count: m.hiring.listings.length },
          { key: 'tickets', label: '🎫 Mentioned in', count: m.tickets.length },
        ]}
      />

      {tab === 'stays' && (
        <table className="table">
          <tbody>
            {m.stays.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link to={`/stays/${s.id}`}>#{s.id}</Link>
                </td>
                <td>{s.reason.toLowerCase()}</td>
                <td>
                  {formatDay(s.startDate)} → {formatDay(s.expectedPickup)}
                </td>
                <td>
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'care' && (
        <>
          <h4>Therapy plans</h4>
          {m.therapy.length === 0 && <p className="muted">None</p>}
          <ul>
            {m.therapy.map((p) => (
              <li key={p.id}>
                {ISSUE_LABEL[p.issue]} · {p.sessions} sessions · since {formatDay(p.startedAt)} <StatusBadge status={p.status} />
              </li>
            ))}
          </ul>
          <h4>Prescriptions</h4>
          {m.medical.prescriptions.length === 0 && <p className="muted">None</p>}
          <ul>
            {m.medical.prescriptions.map((p) => (
              <li key={p.id}>
                🧪 {p.remedy}: {p.dosage}, {p.frequency} {p.endDate && <span className="muted">until {formatDay(p.endDate)}</span>}
              </li>
            ))}
          </ul>
          {m.weights.length > 0 && (
            <>
              <h4>Weight at intake</h4>
              <ul>
                {m.weights.map((w) => (
                  <li key={w.date}>
                    {formatDay(w.date)}: {w.kg} kg
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {tab === 'lairs' && (
        <ul>
          {m.lairHistory.map((a) => (
            <li key={a.id}>
              <Link to={`/lairs/${a.lair.id}`}>{a.lair.name}</Link> · {formatDay(a.assignedAt)} → {a.releasedAt ? formatDay(a.releasedAt) : 'now'}
            </li>
          ))}
        </ul>
      )}

      {tab === 'hiring' && (
        <>
          <ul>
            {m.hiring.listings.map((l) => (
              <li key={l.id}>
                <Link to={`/hiring/${l.id}`}>{l.title}</Link> · from {formatDay(l.availableFrom)} · {toGoldString(l.feeGold)} <StatusBadge status={l.status} />
              </li>
            ))}
          </ul>
          {m.hiring.contracts.map((c) => (
            <p key={c.id}>
              🖋️ Contract {c.reference} {c.signedAt ? `signed ${formatDay(c.signedAt)}` : 'not signed yet'} · {toGoldString(c.fee)}
            </p>
          ))}
        </>
      )}

      {tab === 'tickets' && (
        <ul>
          {m.tickets.map((t) => (
            <li key={t.id}>
              <Link to={`/tickets/${t.id}`}>{t.title}</Link> <StatusBadge status={t.status} /> <span className="muted">{formatDay(t.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
