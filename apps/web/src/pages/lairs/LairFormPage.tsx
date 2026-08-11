import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../api'
import { Button, Card, ErrorMessage, Select, TextArea, TextInput } from '../../components/ui'
import type { Lair } from './LairListPage'

const WINGS = [
  { value: 'NORTH_TOWER', label: '🗼 North Tower' },
  { value: 'DUNGEON', label: '⛓️ Dungeon' },
  { value: 'EAST_WING', label: '🏰 East Wing' },
  { value: 'MOAT', label: '🌊 Moat' },
  { value: 'ROOFTOP', label: '☁️ Rooftop' },
  { value: 'CELLAR', label: '🕯️ Cellar' },
]

type Form = { name: string; wing: string; capacity: string; temperatureC: string; humidity: string; darkness: string; notes: string; isActive: boolean }

const EMPTY: Form = { name: '', wing: 'EAST_WING', capacity: '4', temperatureC: '18', humidity: '50', darkness: '50', notes: '', isActive: true }

function validate(f: Form) {
  const errors: Partial<Record<keyof Form, string>> = {}
  if (f.name.trim().length < 2) errors.name = 'Give the lair a name'
  const cap = Number(f.capacity)
  if (!Number.isInteger(cap) || cap < 1 || cap > 50) errors.capacity = 'Between 1 and 50'
  for (const k of ['humidity', 'darkness'] as const) {
    const n = Number(f[k])
    if (!Number.isInteger(n) || n < 0 || n > 100) errors[k] = '0 to 100'
  }
  if (!Number.isInteger(Number(f.temperatureC))) errors.temperatureC = 'Whole degrees, please'
  return errors
}

export default function LairFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isNew = !id
  const [f, setF] = useState<Form>(EMPTY)
  const errors = validate(f)
  const { data: lair } = useQuery({ queryKey: ['lair', Number(id)], queryFn: () => apiFetch(`/lairs/${id}`) as Promise<Lair>, enabled: !isNew })

  useEffect(() => {
    if (lair)
      setF({
        name: lair.name,
        wing: lair.wing,
        capacity: String(lair.capacity),
        temperatureC: String(lair.temperatureC),
        humidity: String(lair.humidity),
        darkness: String(lair.darkness),
        notes: lair.notes ?? '',
        isActive: lair.isActive,
      })
  }, [lair])

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: f.name.trim(),
        wing: f.wing,
        capacity: Number(f.capacity),
        temperatureC: Number(f.temperatureC),
        humidity: Number(f.humidity),
        darkness: Number(f.darkness),
        notes: f.notes || null,
        isActive: f.isActive,
      }
      return (isNew ? apiFetch('/lairs', { method: 'POST', body }) : apiFetch(`/lairs/${id}`, { method: 'PUT', body })) as Promise<{ id: number }>
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ['lairs'] })
      navigate(`/lairs/${saved.id}`)
    },
  })

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  return (
    <div className="page">
      <h2>🏚️ {isNew ? 'New lair' : `Edit ${lair?.name ?? ''}`}</h2>
      <Card>
        <TextInput label="Name" value={f.name} onChange={set('name')} error={errors.name} />
        <Select label="Wing" value={f.wing} onChange={set('wing')} options={WINGS} />
        <TextInput label="Capacity" type="number" value={f.capacity} onChange={set('capacity')} error={errors.capacity} />
        <TextInput label="Temperature (°C)" type="number" value={f.temperatureC} onChange={set('temperatureC')} error={errors.temperatureC} hint="The Cold Store runs at -12, the Ember Vault at 45" />
        <TextInput label="Humidity (%)" type="number" value={f.humidity} onChange={set('humidity')} error={errors.humidity} />
        <TextInput label="Darkness (%)" type="number" value={f.darkness} onChange={set('darkness')} error={errors.darkness} hint="0 = bright daylight, 100 = pitch black" />
        <TextArea label="Notes" value={f.notes} onChange={set('notes')} />
        <label>
          <input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} /> Open (uncheck while it is being repaired)
        </label>
        <ErrorMessage error={save.error} />
        <div>
          <Button variant="primary" loading={save.isPending} disabled={Object.keys(errors).length > 0} onClick={() => save.mutate()}>
            {isNew ? 'Create lair' : 'Save'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
