// The vet's (and keepers') medicine round: active prescriptions grouped by lair,
// in the order you walk the castle. Ticks are kept in this browser only.
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../api'
import { Card, EmptyState, Spinner } from '../../components/ui'
import { formatDay } from '../../utils/dates'

type ActivePrescription = {
  id: number
  remedy: string
  form: string
  dosage: string
  frequency: string
  startDate: string
  endDate: string | null
  record: { monster: { id: number; name: string } }
}

type LairSummary = { id: number; name: string; wing: string; residents: { id: number; name: string }[] }

const WING_ORDER = ['NORTH_TOWER', 'ROOFTOP', 'EAST_WING', 'DUNGEON', 'CELLAR', 'MOAT']
const FORM_ICON: Record<string, string> = { POTION: '🧪', SALVE: '🫙', TINCTURE: '💧', POULTICE: '🩹', ELIXIR: '✨' }

function storageKey() {
  return `rounds-${new Date().toISOString().slice(0, 10)}`
}

function useTicks() {
  const [ticks, setTicks] = useState<Record<number, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey()) ?? '{}')
    } catch {
      return {}
    }
  })
  useEffect(() => {
    localStorage.setItem(storageKey(), JSON.stringify(ticks))
  }, [ticks])
  return [ticks, (id: number) => setTicks((t) => ({ ...t, [id]: !t[id] }))] as const
}

export default function RoundsPage() {
  const { data: prescriptions, isLoading } = useQuery({ queryKey: ['prescriptions', 'active'], queryFn: () => apiFetch('/medical/prescriptions/active') as Promise<ActivePrescription[]> })
  const { data: lairs } = useQuery({ queryKey: ['lairs'], queryFn: () => apiFetch('/lairs') as Promise<LairSummary[]> })
  const [ticks, toggle] = useTicks()

  const groups = useMemo(() => {
    if (!prescriptions || !lairs) return []
    const lairOf = new Map<number, LairSummary>()
    for (const l of lairs) for (const r of l.residents) lairOf.set(r.id, l)
    const byLair = new Map<string, { lair: LairSummary | null; items: ActivePrescription[] }>()
    for (const p of prescriptions) {
      const lair = lairOf.get(p.record.monster.id) ?? null
      const key = lair ? String(lair.id) : 'none'
      const group = byLair.get(key) ?? { lair, items: [] }
      group.items.push(p)
      byLair.set(key, group)
    }
    return [...byLair.values()].sort((a, b) => {
      const wa = a.lair ? WING_ORDER.indexOf(a.lair.wing) : 99
      const wb = b.lair ? WING_ORDER.indexOf(b.lair.wing) : 99
      return wa - wb || (a.lair?.name ?? '').localeCompare(b.lair?.name ?? '')
    })
  }, [prescriptions, lairs])

  if (isLoading) return <Spinner label="Warming up the potions..." />
  const total = prescriptions?.length ?? 0
  const done = prescriptions?.filter((p) => ticks[p.id]).length ?? 0

  return (
    <div className="page">
      <h2>🧪 Medicine round</h2>
      <p className="muted">
        {done}/{total} given today. Ticks are saved on this device only.
      </p>
      {total === 0 && <EmptyState title="No medicine due today" icon="🎉" />}
      {groups.map((g) => (
        <Card key={g.lair?.id ?? 'none'} title={g.lair ? <Link to={`/lairs/${g.lair.id}`}>🏚️ {g.lair.name}</Link> : '❓ No lair'}>
          <ul className="rounds">
            {g.items.map((p) => (
              <li key={p.id} className={ticks[p.id] ? 'done' : ''}>
                <label>
                  <input type="checkbox" checked={!!ticks[p.id]} onChange={() => toggle(p.id)} /> <b>{p.record.monster.name}</b>: {FORM_ICON[p.form] ?? ''} {p.remedy}, {p.dosage},{' '}
                  {p.frequency}
                </label>
                {p.endDate && <span className="muted"> (until {formatDay(p.endDate)})</span>}
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  )
}
