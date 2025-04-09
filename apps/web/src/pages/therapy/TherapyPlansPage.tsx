import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../api'
import { formatDay } from '../../utils/dates'
import NewPlanForm from './NewPlanForm'
import { ISSUE_LABEL, TREND_ICON, type PlanSummary } from './types'

export default function TherapyPlansPage() {
  const [status, setStatus] = useState('ACTIVE')
  const [mine, setMine] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const { data: plans, isLoading, refetch } = useQuery({
    queryKey: ['therapy-plans', status, mine],
    queryFn: () => apiFetch(`/therapy/plans?${new URLSearchParams({ ...(status ? { status } : {}), ...(mine ? { mine: '1' } : {}) })}`) as Promise<PlanSummary[]>,
  })

  return (
    <div className="page">
      <h2>🛋️ Therapy</h2>
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All plans</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <label>
          <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> my patients
        </label>
        <button onClick={() => setShowNew(!showNew)}>+ New plan</button>
      </div>
      {showNew && (
        <NewPlanForm
          onCreated={() => {
            setShowNew(false)
            refetch()
          }}
        />
      )}
      {isLoading && <p>Plumping the cushions... 🛋️</p>}
      <div className="cards">
        {plans?.map((p) => (
          <Link key={p.id} to={`/therapy/${p.id}`} className="card therapy-card">
            <h3>{p.monster.name}</h3>
            <p className="muted">{p.monster.species?.name}</p>
            <p>{ISSUE_LABEL[p.issue]}</p>
            <p>
              {TREND_ICON[p.progress.trend]} {p.progress.sessions} sessions
              {p.progress.averageLift !== null && <span className="muted"> · avg lift {p.progress.averageLift > 0 ? '+' : ''}{p.progress.averageLift}</span>}
            </p>
            {p.status === 'ACTIVE' && p.nextSessionDate && <p className="muted">next: {formatDay(p.nextSessionDate)}</p>}
            {p.status !== 'ACTIVE' && <span className="badge">{p.status.toLowerCase()}</span>}
          </Link>
        ))}
      </div>
      {plans?.length === 0 && <p className="muted">No plans. Every monster is perfectly well-adjusted. 🧘</p>}
    </div>
  )
}
