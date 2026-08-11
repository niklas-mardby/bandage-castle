import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { hasRole } from '@bandage/shared'
import { apiFetch, ApiError } from '../../api'
import { useAuth } from '../../auth/AuthProvider'
import { useApi } from '../../hooks/useApi'
import type { Lair } from './LairListPage'

type Warning = { field: string; message: string }

export default function LairDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { data: lair, error, reload } = useApi<Lair>(`/lairs/${id}`)
  const { data: unassigned, reload: reloadUnassigned } = useApi<{ id: number; name: string; species: { name: string } | null }[]>('/lairs/unassigned')
  const [monsterId, setMonsterId] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<Warning[]>([])
  const canAssign = hasRole(user, 'ADMIN', 'KEEPER', 'FRONT_DESK')

  if (error) return <p className="page error">{error.message}</p>
  if (!lair) return <p className="page">Loading...</p>

  const assign = async (ignoreHabitatWarnings = false) => {
    setMessage(null)
    try {
      await apiFetch(`/lairs/${lair.id}/assignments`, { method: 'POST', body: { monsterId: Number(monsterId), ignoreHabitatWarnings } })
      setMonsterId('')
      setWarnings([])
      reload()
      reloadUnassigned()
    } catch (e) {
      if (e instanceof ApiError && e.status === 400 && e.details && (e.details as { warnings?: Warning[] }).warnings) {
        setWarnings((e.details as { warnings: Warning[] }).warnings)
      } else {
        setMessage(e instanceof Error ? e.message : 'Could not assign')
      }
    }
  }

  const release = async (assignmentId: number) => {
    await apiFetch(`/lairs/${lair.id}/assignments/${assignmentId}`, { method: 'DELETE' })
    reload()
    reloadUnassigned()
  }

  return (
    <div className="page">
      <Link to="/lairs">← All lairs</Link>
      <h2>
        {lair.name} {canAssign && <Link to={`/lairs/${lair.id}/edit`}>✏️</Link>}
      </h2>
      <p className="muted">
        {lair.wing.replace('_', ' ').toLowerCase()} · capacity {lair.capacity} · 🌡️ {lair.temperatureC} °C · 💧 {lair.humidity}% · 🌑{' '}
        {lair.darkness}%
      </p>
      {lair.notes && <p>{lair.notes}</p>}

      <h3>
        Residents ({lair.occupancy}/{lair.capacity})
      </h3>
      <ul>
        {lair.residents.map((r) => (
          <li key={r.assignmentId}>
            <Link to={`/monsters/${r.id}`}>{r.name}</Link> <span className="muted">{r.species?.name}</span>{' '}
            {canAssign && (
              <button className="link" onClick={() => release(r.assignmentId)}>
                move out
              </button>
            )}
          </li>
        ))}
      </ul>

      {canAssign && lair.isActive && (
        <div className="form">
          <h3>Move a monster in</h3>
          <select value={monsterId} onChange={(e) => setMonsterId(e.target.value)}>
            <option value="">Choose a monster without a lair...</option>
            {unassigned?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.species?.name ?? 'unknown species'})
              </option>
            ))}
          </select>
          <button disabled={!monsterId} onClick={() => assign()}>
            Assign
          </button>
          {message && <p className="error">{message}</p>}
          {warnings.length > 0 && (
            <div className="warning">
              <p>This lair isn't ideal:</p>
              <ul>
                {warnings.map((w) => (
                  <li key={w.field}>{w.message}</li>
                ))}
              </ul>
              <button onClick={() => assign(true)}>Assign anyway</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
