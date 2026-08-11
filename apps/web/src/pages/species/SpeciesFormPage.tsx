import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../api'
import { Button, Card, ErrorMessage, Select, TextArea, TextInput } from '../../components/ui'
import type { Species } from '../../types/species'
import DangerLevel from './DangerLevel'

type Form = Record<
  'name' | 'description' | 'diet' | 'dietType' | 'mealsPerDay' | 'portionKg' | 'dangerLevel' | 'tempMinC' | 'tempMaxC' | 'humidityMin' | 'humidityMax' | 'darkness' | 'lifespanYears',
  string
>

const EMPTY: Form = {
  name: '',
  description: '',
  diet: '',
  dietType: 'OMNIVORE',
  mealsPerDay: '2',
  portionKg: '1',
  dangerLevel: '2',
  tempMinC: '10',
  tempMaxC: '25',
  humidityMin: '30',
  humidityMax: '70',
  darkness: '50',
  lifespanYears: '',
}

const NUMBER_FIELDS = ['mealsPerDay', 'portionKg', 'dangerLevel', 'tempMinC', 'tempMaxC', 'humidityMin', 'humidityMax', 'darkness'] as const

export default function SpeciesFormPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isNew = !slug
  const [f, setF] = useState<Form>(EMPTY)
  const { data: species } = useQuery({ queryKey: ['species', slug], queryFn: () => apiFetch(`/species/${slug}`) as Promise<Species>, enabled: !isNew })

  useEffect(() => {
    if (!species) return
    setF({
      name: species.name,
      description: species.description ?? '',
      diet: species.diet,
      dietType: species.dietType,
      mealsPerDay: String(species.mealsPerDay),
      portionKg: String(species.portionKg),
      dangerLevel: String(species.dangerLevel),
      tempMinC: String(species.tempMinC),
      tempMaxC: String(species.tempMaxC),
      humidityMin: String(species.humidityMin),
      humidityMax: String(species.humidityMax),
      darkness: String(species.darkness),
      lifespanYears: species.lifespanYears === null ? '' : String(species.lifespanYears),
    })
  }, [species])

  const save = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = { name: f.name.trim(), description: f.description || undefined, diet: f.diet.trim(), dietType: f.dietType }
      for (const k of NUMBER_FIELDS) body[k] = Number(f[k])
      body.lifespanYears = f.lifespanYears ? Number(f.lifespanYears) : null
      return (isNew ? apiFetch('/species', { method: 'POST', body }) : apiFetch(`/species/${species!.id}`, { method: 'PUT', body })) as Promise<{ slug: string }>
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ['species'] })
      navigate(`/species/${saved.slug}`)
    },
  })

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const rangeError = (min: string, max: string) => (Number(min) > Number(max) ? 'Minimum is above maximum' : null)

  return (
    <div className="page">
      <h2>📖 {isNew ? 'Add a species' : `Edit ${species?.name ?? ''}`}</h2>
      <Card>
        <TextInput label="Name" value={f.name} onChange={set('name')} />
        <TextArea label="Description" value={f.description} onChange={set('description')} />
        <TextInput label="Diet" value={f.diet} onChange={set('diet')} hint="What the kitchen should know, e.g. 'Goats, turnips'" />
        <Select
          label="Diet type"
          value={f.dietType}
          onChange={set('dietType')}
          options={['CARNIVORE', 'HERBIVORE', 'OMNIVORE', 'MINERAL', 'ETHEREAL'].map((d) => ({ value: d, label: d.toLowerCase() }))}
        />
        <div className="form inline wrap">
          <TextInput label="Meals per day" type="number" value={f.mealsPerDay} onChange={set('mealsPerDay')} />
          <TextInput label="Portion (kg)" type="number" step="0.1" value={f.portionKg} onChange={set('portionKg')} />
        </div>
        <Select label="Danger level" value={f.dangerLevel} onChange={set('dangerLevel')} options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: '💀'.repeat(n) }))} />
        <DangerLevel level={Number(f.dangerLevel)} />
        <div className="form inline wrap">
          <TextInput label="Min °C" type="number" value={f.tempMinC} onChange={set('tempMinC')} error={rangeError(f.tempMinC, f.tempMaxC)} />
          <TextInput label="Max °C" type="number" value={f.tempMaxC} onChange={set('tempMaxC')} />
          <TextInput label="Min humidity %" type="number" value={f.humidityMin} onChange={set('humidityMin')} error={rangeError(f.humidityMin, f.humidityMax)} />
          <TextInput label="Max humidity %" type="number" value={f.humidityMax} onChange={set('humidityMax')} />
          <TextInput label="Darkness %" type="number" value={f.darkness} onChange={set('darkness')} />
          <TextInput label="Lifespan (years)" type="number" value={f.lifespanYears} onChange={set('lifespanYears')} hint="Leave empty if nobody knows" />
        </div>
        <ErrorMessage error={save.error} />
        <Button variant="primary" loading={save.isPending} disabled={!f.name.trim() || !f.diet.trim()} onClick={() => save.mutate()}>
          {isNew ? 'Add to the compendium' : 'Save'}
        </Button>
      </Card>
    </div>
  )
}
