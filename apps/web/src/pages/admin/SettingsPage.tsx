import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../api'

type OpeningHours = { open: string; close: string; closedDays: string[]; visitingFrom: string; visitingUntil: string }
type Prices = { defaultDailyRateGold: number; lateFeePerDayGold: number; treatmentSuppliesPerNightGold: number }
type Castle = { name: string; motto: string; emergencyRaven: string }
type AllSettings = { opening_hours?: OpeningHours; prices?: Prices; castle?: Castle }
type Flag = { key: string; enabled: boolean; description: string | null }

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

function useSaveSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => apiFetch(`/settings/${key}`, { method: 'PUT', body: value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}

function OpeningHoursForm({ value }: { value: OpeningHours }) {
  const [v, setV] = useState(value)
  const save = useSaveSetting()
  useEffect(() => setV(value), [value])
  return (
    <fieldset>
      <legend>🕰️ Opening hours</legend>
      <div className="form inline wrap">
        <label>
          open <input type="time" value={v.open} onChange={(e) => setV({ ...v, open: e.target.value })} />
        </label>
        <label>
          close <input type="time" value={v.close} onChange={(e) => setV({ ...v, close: e.target.value })} />
        </label>
        <label>
          visitors from <input type="time" value={v.visitingFrom} onChange={(e) => setV({ ...v, visitingFrom: e.target.value })} />
        </label>
        <label>
          until <input type="time" value={v.visitingUntil} onChange={(e) => setV({ ...v, visitingUntil: e.target.value })} />
        </label>
      </div>
      <div className="roles">
        Closed on:{' '}
        {DAYS.map((d) => (
          <label key={d}>
            <input
              type="checkbox"
              checked={v.closedDays.includes(d)}
              onChange={(e) => setV({ ...v, closedDays: e.target.checked ? [...v.closedDays, d] : v.closedDays.filter((x) => x !== d) })}
            />
            {d}
          </label>
        ))}
      </div>
      <button onClick={() => save.mutate({ key: 'opening_hours', value: v })}>Save</button>
      {save.isSuccess && <span className="muted"> saved ✓</span>}
      {save.error && <span className="error"> {(save.error as Error).message}</span>}
    </fieldset>
  )
}

function PricesForm({ value }: { value: Prices }) {
  const [v, setV] = useState(value)
  const save = useSaveSetting()
  useEffect(() => setV(value), [value])
  const num = (field: keyof Prices) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [field]: Number(e.target.value) })
  return (
    <fieldset>
      <legend>🪙 Prices (gold)</legend>
      <div className="form inline wrap">
        <label>
          default nightly rate <input className="small" type="number" step="0.01" value={v.defaultDailyRateGold} onChange={num('defaultDailyRateGold')} />
        </label>
        <label>
          late fee per day <input className="small" type="number" step="0.01" value={v.lateFeePerDayGold} onChange={num('lateFeePerDayGold')} />
        </label>
        <label>
          treatment supplies per night <input className="small" type="number" step="0.01" value={v.treatmentSuppliesPerNightGold} onChange={num('treatmentSuppliesPerNightGold')} />
        </label>
      </div>
      <button onClick={() => save.mutate({ key: 'prices', value: v })}>Save</button>
      {save.isSuccess && <span className="muted"> saved ✓</span>}
      {save.error && <span className="error"> {(save.error as Error).message}</span>}
    </fieldset>
  )
}

function CastleForm({ value }: { value: Castle }) {
  const [v, setV] = useState(value)
  const save = useSaveSetting()
  useEffect(() => setV(value), [value])
  return (
    <fieldset>
      <legend>🏰 The castle</legend>
      <div className="form">
        <label>Name</label>
        <input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        <label>Motto</label>
        <input value={v.motto} onChange={(e) => setV({ ...v, motto: e.target.value })} />
        <label>Emergency raven</label>
        <input value={v.emergencyRaven} onChange={(e) => setV({ ...v, emergencyRaven: e.target.value })} />
      </div>
      <button onClick={() => save.mutate({ key: 'castle', value: v })}>Save</button>
      {save.isSuccess && <span className="muted"> saved ✓</span>}
    </fieldset>
  )
}

function FlagsPanel() {
  const qc = useQueryClient()
  const { data: flags } = useQuery({ queryKey: ['flags', 'detailed'], queryFn: () => apiFetch('/flags/detailed') as Promise<Flag[]> })
  const toggle = useMutation({
    mutationFn: (f: Flag) => apiFetch(`/flags/${f.key}`, { method: 'PUT', body: { enabled: !f.enabled } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flags'] })
    },
  })
  return (
    <fieldset>
      <legend>🚩 Feature flags</legend>
      {flags?.map((f) => (
        <div key={f.key} className="flag-row">
          <label>
            <input type="checkbox" checked={f.enabled} onChange={() => toggle.mutate(f)} /> <code>{f.key}</code>
          </label>
          <span className="muted"> {f.description}</span>
        </div>
      ))}
    </fieldset>
  )
}

export default function SettingsPage() {
  const { data } = useQuery({ queryKey: ['settings'], queryFn: () => apiFetch('/settings') as Promise<AllSettings> })
  if (!data) return <p className="page">Loading...</p>
  return (
    <div className="page settings">
      <h2>⚙️ Settings</h2>
      {data.opening_hours && <OpeningHoursForm value={data.opening_hours} />}
      {data.prices && <PricesForm value={data.prices} />}
      {data.castle && <CastleForm value={data.castle} />}
      <FlagsPanel />
    </div>
  )
}
