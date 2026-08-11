import { Link } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'

export type Resident = { assignmentId: number; id: number; name: string; species: { id: number; name: string } | null }

export type Lair = {
  id: number
  name: string
  wing: string
  capacity: number
  temperatureC: number
  humidity: number
  darkness: number
  notes: string | null
  isActive: boolean
  occupancy: number
  residents: Resident[]
}

const WING_LABELS: Record<string, string> = {
  NORTH_TOWER: '🗼 North Tower',
  DUNGEON: '⛓️ Dungeon',
  EAST_WING: '🏰 East Wing',
  MOAT: '🌊 Moat',
  ROOFTOP: '☁️ Rooftop',
  CELLAR: '🕯️ Cellar',
}

function OccupancyBar({ occupancy, capacity }: { occupancy: number; capacity: number }) {
  const pct = Math.min(100, Math.round((occupancy / capacity) * 100))
  const cls = pct >= 100 ? 'full' : pct >= 75 ? 'busy' : 'ok'
  return (
    <div className="occupancy" title={`${occupancy} of ${capacity}`}>
      <div className={`occupancy-fill ${cls}`} style={{ width: `${pct}%` }} />
      <span>
        {occupancy}/{capacity}
      </span>
    </div>
  )
}

export default function LairListPage() {
  const { data: lairs, error } = useApi<Lair[]>('/lairs')
  const { data: unassigned } = useApi<{ id: number; name: string }[]>('/lairs/unassigned')

  if (error) return <p className="page error">{error.message}</p>
  if (!lairs) return <p className="page">Counting lairs... 🕯️</p>

  const wings = Array.from(new Set(lairs.map((l) => l.wing)))

  return (
    <div className="page">
      <h2>🏚️ Lairs</h2>
      <Link to="/lairs/new">+ New lair</Link>
      {unassigned && unassigned.length > 0 && (
        <p className="warning">
          ⚠️ {unassigned.length} monster(s) in residence have no lair: {unassigned.map((m) => m.name).join(', ')}
        </p>
      )}
      {wings.map((wing) => (
        <section key={wing}>
          <h3>{WING_LABELS[wing] ?? wing}</h3>
          <div className="cards">
            {lairs
              .filter((l) => l.wing === wing)
              .map((l) => (
                <Link to={`/lairs/${l.id}`} key={l.id} className={`card lair-card ${l.isActive ? '' : 'inactive'}`}>
                  <h4>{l.name}</h4>
                  {!l.isActive && <span className="badge badge-warn">closed</span>}
                  <OccupancyBar occupancy={l.occupancy} capacity={l.capacity} />
                  <p className="muted">
                    🌡️ {l.temperatureC} °C · 💧 {l.humidity}% · 🌑 {l.darkness}%
                  </p>
                  <p>{l.residents.map((r) => r.name).join(', ') || <i>empty</i>}</p>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}
