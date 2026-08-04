import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api'
import { useDebounced } from '../hooks/useDebounced'

type Hit = { type: string; id: number; title: string; subtitle: string | null; url: string }

const ICON: Record<string, string> = { monster: '🐉', customer: '🧾', species: '📖', ticket: '🎫', bulletin: '📜', lair: '🏚️' }

export default function SearchBox() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const debounced = useDebounced(q, 250)
  const box = useRef<HTMLDivElement>(null)
  const { data: hits } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => apiFetch(`/search?q=${encodeURIComponent(debounced)}`) as Promise<Hit[]>,
    enabled: debounced.trim().length >= 2,
  })

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const go = (hit: Hit) => {
    setOpen(false)
    setQ('')
    navigate(hit.url)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (!hits?.length) return
    if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, hits.length - 1))
    if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0))
    if (e.key === 'Enter') go(hits[active])
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="searchbox" ref={box}>
      <input
        placeholder="🔍 Search the castle..."
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
      />
      {open && debounced.length >= 2 && hits && (
        <div className="search-results">
          {hits.length === 0 && <p className="muted">Nothing found. Check under the bed? 🛏️</p>}
          {hits.map((h, i) => (
            <button key={`${h.type}-${h.id}`} className={`search-hit ${i === active ? 'active' : ''}`} onMouseEnter={() => setActive(i)} onClick={() => go(h)}>
              <span>{ICON[h.type] ?? '•'}</span> <b>{h.title}</b> {h.subtitle && <span className="muted">{h.subtitle}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
