import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../api'
import { formatDay } from '../../utils/dates'
import { ISSUE_LABEL, TREND_ICON, type PlanDetail, type Session } from './types'

const MOOD_FACE = ['', '😭', '😢', '😟', '🙁', '😐', '🙂', '😊', '😄', '😁', '🤩']

function MoodChart({ sessions }: { sessions: Session[] }) {
  const ordered = [...sessions].reverse()
  if (ordered.length === 0) return null
  return (
    <div className="mood-chart" aria-label="Mood before and after each session">
      {ordered.map((s) => (
        <div className="mood-col" key={s.id} title={`${formatDay(s.sessionDate)}: ${s.moodBefore} → ${s.moodAfter}`}>
          <div className="mood-bar before" style={{ height: `${s.moodBefore * 10}%` }} />
          <div className="mood-bar after" style={{ height: `${s.moodAfter * 10}%` }} />
        </div>
      ))}
    </div>
  )
}

function SessionForm({ planId, onSaved }: { planId: number; onSaved: () => void }) {
  const [form, setForm] = useState({ sessionDate: new Date().toISOString().slice(0, 10), durationMin: 50, moodBefore: 5, moodAfter: 5, notes: '', homework: '' })
  const save = useMutation({
    mutationFn: () => apiFetch(`/therapy/plans/${planId}/sessions`, { method: 'POST', body: { ...form, homework: form.homework || undefined } }),
    onSuccess: () => {
      setForm({ ...form, notes: '', homework: '' })
      onSaved()
    },
  })
  return (
    <div className="form panel">
      <h3>Log a session</h3>
      <div className="form inline wrap">
        <input type="date" value={form.sessionDate} onChange={(e) => setForm({ ...form, sessionDate: e.target.value })} />
        <label>
          minutes <input className="small" type="number" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })} />
        </label>
        <label>
          mood before {MOOD_FACE[form.moodBefore]}
          <input type="range" min={1} max={10} value={form.moodBefore} onChange={(e) => setForm({ ...form, moodBefore: Number(e.target.value) })} />
        </label>
        <label>
          mood after {MOOD_FACE[form.moodAfter]}
          <input type="range" min={1} max={10} value={form.moodAfter} onChange={(e) => setForm({ ...form, moodAfter: Number(e.target.value) })} />
        </label>
      </div>
      <label>Notes</label>
      <textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      <label>Homework</label>
      <input value={form.homework} onChange={(e) => setForm({ ...form, homework: e.target.value })} placeholder="e.g. look at a picture of a bridge for one minute" />
      <div>
        <button disabled={form.notes.trim().length < 3 || save.isPending} onClick={() => save.mutate()}>
          Save session
        </button>
      </div>
      {save.error && <p className="error">{(save.error as Error).message}</p>}
    </div>
  )
}

export default function TherapyPlanPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const key = ['therapy-plan', Number(id)]
  const { data: plan, error } = useQuery({ queryKey: key, queryFn: () => apiFetch(`/therapy/plans/${id}`) as Promise<PlanDetail> })
  const setStatus = useMutation({
    mutationFn: (status: PlanDetail['status']) => apiFetch(`/therapy/plans/${id}`, { method: 'PATCH', body: { status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  if (error) return <p className="page error">{(error as Error).message}</p>
  if (!plan) return <p className="page">Loading...</p>

  return (
    <div className="page">
      <Link to="/therapy">← Therapy</Link>
      <h2>
        {plan.monster.name}: {ISSUE_LABEL[plan.issue]}
      </h2>
      <p className="muted">
        {plan.monster.species?.name} · since {formatDay(plan.startedAt)} · therapist {plan.therapist?.displayName ?? 'unknown'} · <b>{plan.status.toLowerCase()}</b>
      </p>
      <p className="description">{plan.goals}</p>
      <p>
        {TREND_ICON[plan.progress.trend]} {plan.progress.trend} · {plan.progress.sessions} sessions · average lift{' '}
        {plan.progress.averageLift ?? '—'}
      </p>
      <MoodChart sessions={plan.sessions} />

      <div className="toolbar">
        {plan.status === 'ACTIVE' && <button onClick={() => setStatus.mutate('PAUSED')}>⏸️ Pause</button>}
        {plan.status !== 'ACTIVE' && <button onClick={() => setStatus.mutate('ACTIVE')}>▶️ Resume</button>}
        {plan.status !== 'COMPLETED' && <button onClick={() => setStatus.mutate('COMPLETED')}>🎉 Complete</button>}
      </div>

      {plan.status !== 'COMPLETED' && <SessionForm planId={plan.id} onSaved={() => qc.invalidateQueries({ queryKey: key })} />}

      <h3>Sessions</h3>
      {plan.sessions.map((s) => (
        <div className="card wide" key={s.id}>
          <h4>
            {formatDay(s.sessionDate)} · {s.durationMin} min · {MOOD_FACE[s.moodBefore]} → {MOOD_FACE[s.moodAfter]}
          </h4>
          <p>{s.notes}</p>
          {s.homework && <p className="muted">📝 Homework: {s.homework}</p>}
        </div>
      ))}
    </div>
  )
}
