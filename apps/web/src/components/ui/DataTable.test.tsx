// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DataTable, type Column } from './DataTable'

type Row = { id: number; name: string; heads: number }

const rows: Row[] = [
  { id: 1, name: 'Hester', heads: 5 },
  { id: 2, name: 'Basil', heads: 1 },
  { id: 3, name: 'Clucky', heads: 1 },
]

const columns: Column<Row>[] = [
  { key: 'name', header: 'Name', render: (r) => r.name, sortValue: (r) => r.name },
  { key: 'heads', header: 'Heads', render: (r) => r.heads, sortValue: (r) => r.heads },
]

const names = () => screen.getAllByRole('row').slice(1).map((tr) => tr.querySelector('td')?.textContent)

afterEach(cleanup)

describe('DataTable', () => {
  it('renders one row per item', () => {
    render(<DataTable rows={rows} columns={columns} rowKey={(r) => r.id} />)
    expect(names()).toEqual(['Hester', 'Basil', 'Clucky'])
  })

  it('sorts when a header is clicked, and reverses on the second click', () => {
    render(<DataTable rows={rows} columns={columns} rowKey={(r) => r.id} />)
    fireEvent.click(screen.getByText('Name'))
    expect(names()).toEqual(['Basil', 'Clucky', 'Hester'])
    fireEvent.click(screen.getByText(/Name/))
    expect(names()).toEqual(['Hester', 'Clucky', 'Basil'])
  })

  it('pages long tables', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ id: i, name: `Goblin ${i}`, heads: 1 }))
    render(<DataTable rows={many} columns={columns} rowKey={(r) => r.id} pageSize={10} />)
    expect(screen.getAllByRole('row')).toHaveLength(11)
    expect(screen.getByText('page 1 of 3')).toBeTruthy()
    fireEvent.click(screen.getByText(/next/))
    expect(screen.getByText('page 2 of 3')).toBeTruthy()
    expect(names()[0]).toBe('Goblin 10')
  })

  it('shows an empty state', () => {
    render(<DataTable rows={[]} columns={columns} rowKey={(r) => r.id} empty={<p>No monsters</p>} />)
    expect(screen.getByText('No monsters')).toBeTruthy()
  })
})
