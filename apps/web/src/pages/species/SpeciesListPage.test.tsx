// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Species } from '../../types/species'
import SpeciesListPage from './SpeciesListPage'

const details = {
  description: null,
  dietType: 'CARNIVORE' as const,
  mealsPerDay: 2,
  portionKg: 3,
  dangerLevel: 2,
  tempMinC: 10,
  tempMaxC: 25,
  humidityMin: 15,
  humidityMax: 50,
  darkness: 10,
  lifespanYears: null,
  residentCount: 1,
  incompatibleWith: [],
}

const species: Species[] = [
  { ...details, id: 1, name: 'Dragon', slug: 'dragon', diet: 'Roasted turnips' },
  { ...details, id: 2, name: 'Troll', slug: 'troll', diet: 'Dried mushrooms' },
]

vi.mock('../../hooks/useApi', () => ({
  useApi: () => ({ data: species, loading: false, error: null }),
}))

afterEach(cleanup)

describe('SpeciesListPage search', () => {
  it.each(['dragon', 'dRaGoN', 'ROASTED TURNIPS'])('matches %s without case sensitivity', (query) => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SpeciesListPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('Search species...'), { target: { value: query } })
    expect(screen.getByRole('heading', { name: 'Dragon' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Troll' })).toBeNull()
    fireEvent.change(screen.getByPlaceholderText('Search species...'), { target: { value: '' } })
    expect(screen.getByRole('heading', { name: 'Troll' })).toBeTruthy()
  })
})
