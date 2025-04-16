import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../api'
import { ISSUE_LABEL, type Issue } from './types'

type MonsterOption = { id: number; name: string; species: string; status: string }

export default function NewPlanForm({ onCreated }: { onCreated: () => void }) {
  const { data: monsters } = useQuery({ queryKey: ['monsters', 'all'], queryFn: () => apiFetch('/monsters') as Promise<MonsterOption[]> })
  const [monsterId, setMonsterId] = useState('')
  const [issue, setIssue] = useState<Issue>('ADVENTURER_TRAUMA')
  const [goals, setGoals] = useState('')
  const [startedAt, setStartedAt] = useState(new Date().toISOString().slice(0, 10))

  const create = useMutation({
    mutationFn: () => apiFetch('/therapy/plans', { method: 'POST', body: { monsterId: Number(monsterId), issue, goals, startedAt } }),
    onSuccess: onCreated,
  })

  return (
    <div className="form panel">
      <h3>New therapy plan</h3>
      <label>Monster</label>
      <select value={monsterId} onChange={(e) => setMonsterId(e.target.value)}>
        <option value="">--</option>
        {monsters
          ?.filter((m) => m.status === 'IN_RESIDENCE')
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.species})
            </option>
          ))}
      </select>
      <label>Issue</label>
      <select value={issue} onChange={(e) => setIssue(e.target.value as Issue)}>
        {Object.entries(ISSUE_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <label>Goals</label>
      <textarea value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="e.g. Walk past a lit torch without hiding in a teapot." />
      <label>Start</label>
      <input type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
      <div>
        <button disabled={!monsterId || goals.trim().length < 10 || create.isPending} onClick={() => create.mutate()}>
          Create plan
        </button>
      </div>
      {create.error && <p className="error">{(create.error as Error).message}</p>}
    </div>
  )
}
