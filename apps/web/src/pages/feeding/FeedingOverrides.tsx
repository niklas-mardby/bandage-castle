import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../api'

type Override = {
  id: number
  lairId: number
  speciesId: number | null
  mealsPerDay: number | null
  portionKg: string | null
  food: string | null
  note: string | null
  lair: { id: number; name: string }
}

type Option = { id: number; name: string }

/** Lair-specific feeding rules, e.g. an extra winter meal for the Ember Vault dragons. */
export default function FeedingOverrides() {
  const qc = useQueryClient()
  const { data: overrides } = useQuery({ queryKey: ['feeding-overrides'], queryFn: () => apiFetch('/feeding/overrides') as Promise<Override[]> })
  const { data: lairs } = useQuery({ queryKey: ['lairs'], queryFn: () => apiFetch('/lairs') as Promise<Option[]> })
  const { data: species } = useQuery({ queryKey: ['species'], queryFn: () => apiFetch('/species') as Promise<Option[]> })
  const [form, setForm] = useState({ lairId: '', speciesId: '', mealsPerDay: '', portionKg: '', note: '' })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['feeding-overrides'] })
    qc.invalidateQueries({ queryKey: ['feeding-schedule'] })
  }
  const create = useMutation({
    mutationFn: () =>
      apiFetch('/feeding/overrides', {
        method: 'POST',
        body: {
          lairId: Number(form.lairId),
          speciesId: form.speciesId ? Number(form.speciesId) : null,
          mealsPerDay: form.mealsPerDay ? Number(form.mealsPerDay) : null,
          portionKg: form.portionKg ? Number(form.portionKg) : null,
          note: form.note || null,
        },
      }),
    onSuccess: () => {
      setForm({ lairId: '', speciesId: '', mealsPerDay: '', portionKg: '', note: '' })
      invalidate()
    },
  })
  const remove = useMutation({ mutationFn: (id: number) => apiFetch(`/feeding/overrides/${id}`, { method: 'DELETE' }), onSuccess: invalidate })
  const speciesName = (id: number | null) => (id === null ? 'everyone' : (species?.find((s) => s.id === id)?.name ?? `species #${id}`))

  return (
    <div className="panel">
      <h3>⚙️ Lair overrides</h3>
      <ul>
        {overrides?.map((o) => (
          <li key={o.id}>
            <b>{o.lair.name}</b> ({speciesName(o.speciesId)}):
            {o.mealsPerDay !== null && ` ${o.mealsPerDay} meals/day`}
            {o.portionKg !== null && ` · ${o.portionKg} kg`}
            {o.note && <span className="muted"> — {o.note}</span>}{' '}
            <button className="link" onClick={() => remove.mutate(o.id)}>
              remove
            </button>
          </li>
        ))}
      </ul>
      <div className="form inline wrap">
        <select value={form.lairId} onChange={(e) => setForm({ ...form, lairId: e.target.value })}>
          <option value="">lair...</option>
          {lairs?.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select value={form.speciesId} onChange={(e) => setForm({ ...form, speciesId: e.target.value })}>
          <option value="">all species</option>
          {species?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input className="small" placeholder="meals" value={form.mealsPerDay} onChange={(e) => setForm({ ...form, mealsPerDay: e.target.value })} />
        <input className="small" placeholder="kg" value={form.portionKg} onChange={(e) => setForm({ ...form, portionKg: e.target.value })} />
        <input placeholder="note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <button disabled={!form.lairId || create.isPending} onClick={() => create.mutate()}>
          Add
        </button>
      </div>
    </div>
  )
}
