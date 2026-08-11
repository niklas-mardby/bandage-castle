import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { hasRole } from '@bandage/shared'
import { apiFetch } from '../../api'
import { useAuth } from '../../auth/AuthProvider'
import { useApi } from '../../hooks/useApi'
import type { Species } from '../../types/species'
import DangerLevel from './DangerLevel'

type SpeciesDetail = Species & { monsters: { id: number; name: string; status: string }[] }

export default function SpeciesDetailPage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const { data: species, error, reload } = useApi<SpeciesDetail>(`/species/${slug}`)
  const { data: all } = useApi<Species[]>('/species')
  const [rule, setRule] = useState({ incompatibleSpeciesId: '', reason: '' })
  const [ruleError, setRuleError] = useState('')
  const canEditRules = hasRole(user, 'ADMIN', 'VET', 'KEEPER')

  if (error) return <p className="page error">{error.message}</p>
  if (!species) return <p className="page">Loading...</p>

  const addRule = async (e: FormEvent) => {
    e.preventDefault()
    setRuleError('')
    try {
      await apiFetch(`/species/${species.id}/rules`, {
        method: 'POST',
        body: { incompatibleSpeciesId: Number(rule.incompatibleSpeciesId), reason: rule.reason },
      })
      setRule({ incompatibleSpeciesId: '', reason: '' })
      reload()
    } catch (err) {
      setRuleError(err instanceof Error ? err.message : 'Could not add rule')
    }
  }

  const removeRule = async (ruleId: number) => {
    await apiFetch(`/species/${species.id}/rules/${ruleId}`, { method: 'DELETE' })
    reload()
  }

  return (
    <div className="page">
      <Link to="/species">← Compendium</Link>
      <h2>
        {species.name} {hasRole(user, 'ADMIN', 'VET') && <Link to={`/species/${species.slug}/edit`}>✏️</Link>}
      </h2>
      <DangerLevel level={species.dangerLevel} />
      {species.description && <p>{species.description}</p>}

      <table className="table facts">
        <tbody>
          <tr>
            <th>Diet</th>
            <td>
              {species.diet} ({species.dietType.toLowerCase()})
            </td>
          </tr>
          <tr>
            <th>Feeding</th>
            <td>
              {species.mealsPerDay} meals a day, {species.portionKg} kg each
            </td>
          </tr>
          <tr>
            <th>Temperature</th>
            <td>
              {species.tempMinC} – {species.tempMaxC} °C
            </td>
          </tr>
          <tr>
            <th>Humidity</th>
            <td>
              {species.humidityMin} – {species.humidityMax} %
            </td>
          </tr>
          <tr>
            <th>Darkness</th>
            <td>{species.darkness} %</td>
          </tr>
          <tr>
            <th>Lifespan</th>
            <td>{species.lifespanYears ? `${species.lifespanYears} years` : 'Unknown (possibly forever)'}</td>
          </tr>
        </tbody>
      </table>

      <h3>⚠️ Never house next to</h3>
      {species.incompatibleWith.length === 0 ? (
        <p className="muted">No known enemies. How nice.</p>
      ) : (
        <ul>
          {species.incompatibleWith.map((r) => (
            <li key={r.id}>
              <b>{r.speciesName}</b> — {r.reason}{' '}
              {canEditRules && (
                <button className="link" onClick={() => removeRule(r.id)}>
                  remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canEditRules && (
        <form className="form inline" onSubmit={addRule}>
          <select value={rule.incompatibleSpeciesId} onChange={(e) => setRule({ ...rule, incompatibleSpeciesId: e.target.value })}>
            <option value="">Add a species...</option>
            {all
              ?.filter((s) => s.id !== species.id)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
          <input placeholder="reason" value={rule.reason} onChange={(e) => setRule({ ...rule, reason: e.target.value })} />
          <button type="submit" disabled={!rule.incompatibleSpeciesId || !rule.reason}>
            Add rule
          </button>
          {ruleError && <span className="error">{ruleError}</span>}
        </form>
      )}

      <h3>Known individuals</h3>
      <ul>
        {species.monsters.map((m) => (
          <li key={m.id}>
            <Link to={`/monsters/${m.id}`}>{m.name}</Link> <span className="badge">{m.status}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
