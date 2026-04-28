import type { ReactNode } from 'react'

export type TabDef<K extends string> = { key: K; label: ReactNode; count?: number }

export function Tabs<K extends string>({ tabs, active, onChange }: { tabs: TabDef<K>[]; active: K; onChange: (key: K) => void }) {
  return (
    <div className="ui-tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.key} role="tab" aria-selected={t.key === active} className={t.key === active ? 'active' : ''} onClick={() => onChange(t.key)}>
          {t.label}
          {t.count !== undefined && <span className="ui-tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}
