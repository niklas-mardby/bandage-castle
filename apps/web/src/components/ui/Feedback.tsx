import type { ReactNode } from 'react'

const LOADING_LINES = ['Feeding the dragons...', 'Counting bandages...', 'Waking the gargoyles...', 'Polishing the portcullis...', 'Asking the ravens...']

export function Spinner({ label }: { label?: string }) {
  const line = label ?? LOADING_LINES[Math.floor(Date.now() / 1000) % LOADING_LINES.length]
  return (
    <div className="ui-spinner" role="status">
      <span className="ui-spinner-icon" aria-hidden>
        🕯️
      </span>
      {line}
    </div>
  )
}

export function EmptyState({ icon = '🦇', title, children }: { icon?: string; title: string; children?: ReactNode }) {
  return (
    <div className="ui-empty">
      <div className="ui-empty-icon">{icon}</div>
      <h4>{title}</h4>
      {children && <div className="muted">{children}</div>}
    </div>
  )
}

export function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null
  const message = error instanceof Error ? error.message : String(error)
  return (
    <div className="ui-error" role="alert">
      🚨 {message}
    </div>
  )
}
