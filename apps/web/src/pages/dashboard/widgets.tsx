import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function StatTile({ icon, label, value, to, tone }: { icon: string; label: string; value: ReactNode; to?: string; tone?: 'warn' | 'danger' | 'ok' }) {
  const body = (
    <div className={`stat-tile ${tone ?? ''}`}>
      <span className="stat-icon">{icon}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
  return to ? (
    <Link to={to} className="stat-link">
      {body}
    </Link>
  ) : (
    body
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="dash-section">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

/** Tiny bar chart, no library needed. */
export function BarChart({ data, format }: { data: { label: string; value: number }[]; format: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="bar-chart">
      {data.map((d) => (
        <div className="bar-col" key={d.label} title={`${d.label}: ${format(d.value)}`}>
          <div className="bar" style={{ height: `${(d.value / max) * 100}%` }} />
          <span className="bar-label">{d.label.slice(5)}</span>
        </div>
      ))}
    </div>
  )
}

export function Loading() {
  return <p className="muted">Counting things... 🧮</p>
}
