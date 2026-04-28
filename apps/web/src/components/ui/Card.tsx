import type { ReactNode } from 'react'

export function Card({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`ui-card ${className ?? ''}`}>
      {(title || actions) && (
        <header className="ui-card-header">
          {title && <h3>{title}</h3>}
          {actions && <div className="ui-card-actions">{actions}</div>}
        </header>
      )}
      <div className="ui-card-body">{children}</div>
    </section>
  )
}
