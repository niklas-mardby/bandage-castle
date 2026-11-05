import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import type { Species } from '../../types/species'
import DangerLevel from './DangerLevel'

export default function SpeciesListPage() {
  const { data: species, loading, error } = useApi<Species[]>('/species')
  const [query, setQuery] = useState('')

  if (error) return <p className="page error">{error.message}</p>
  if (loading || !species) return <p className="page">Opening the compendium... 📖</p>

  const needle = query.toLowerCase()
  const filtered = needle ? species.filter((s) => s.name.toLowerCase().includes(needle) || s.diet.toLowerCase().includes(needle)) : species

  return (
    <div className="page">
      <h2>📖 Species Compendium</h2>
      <p className="muted">{species.length} species known to the castle.</p>
      <input className="search" placeholder="Search species..." value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="cards">
        {filtered.map((s) => (
          <Link to={`/species/${s.slug}`} className="card species-card" key={s.id}>
            <h3>{s.name}</h3>
            <DangerLevel level={s.dangerLevel} />
            <p className="muted">{s.diet}</p>
            <p>
              🌡️ {s.tempMinC}–{s.tempMaxC} °C · 🌑 {s.darkness}% dark
            </p>
            <p>{s.residentCount} in residence</p>
            {s.incompatibleWith.length > 0 && <p className="warn-text">⚠️ Keep away from: {s.incompatibleWith.map((r) => r.speciesName).join(', ')}</p>}
          </Link>
        ))}
      </div>
    </div>
  )
}
