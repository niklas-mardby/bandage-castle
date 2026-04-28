import { useMemo, useState, type ReactNode } from 'react'
import { EmptyState } from './Feedback'

export type Column<T> = {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  /** value used for sorting; columns without it are not sortable */
  sortValue?: (row: T) => string | number | null
  width?: string
}

type Props<T> = {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string | number
  empty?: ReactNode
  initialSort?: { key: string; dir: 'asc' | 'desc' }
  pageSize?: number
}

export function DataTable<T>({ rows, columns, rowKey, empty, initialSort, pageSize = 25 }: Props<T>) {
  const [sort, setSort] = useState(initialSort ?? null)
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    const get = col.sortValue
    return [...rows].sort((a, b) => {
      const va = get(a)
      const vb = get(b)
      if (va === vb) return 0
      if (va === null) return 1
      if (vb === null) return -1
      const cmp = va < vb ? -1 : 1
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [rows, columns, sort])

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, pages - 1)
  const visible = sorted.slice(current * pageSize, current * pageSize + pageSize)

  const toggleSort = (key: string) => {
    setSort((s) => (s && s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
    setPage(0)
  }

  if (rows.length === 0) return <>{empty ?? <EmptyState title="Nothing here yet" />}</>

  return (
    <>
      <table className="table ui-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width }} className={c.sortValue ? 'sortable' : ''} onClick={c.sortValue ? () => toggleSort(c.key) : undefined}>
                {c.header}
                {sort?.key === c.key && (sort.dir === 'asc' ? ' ▲' : ' ▼')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((c) => (
                <td key={c.key}>{c.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {pages > 1 && <Pagination page={current} pages={pages} onChange={setPage} />}
    </>
  )
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  return (
    <div className="pager">
      <button disabled={page === 0} onClick={() => onChange(page - 1)}>
        ‹ prev
      </button>
      <span>
        page {page + 1} of {pages}
      </span>
      <button disabled={page >= pages - 1} onClick={() => onChange(page + 1)}>
        next ›
      </button>
    </div>
  )
}
