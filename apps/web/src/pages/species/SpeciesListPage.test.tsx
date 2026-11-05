// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SpeciesListPage from './SpeciesListPage'

const { speciesFixture } = vi.hoisted(() => ({
  speciesFixture: [
    {
      id: 1,
      name: 'Dragon',
      slug: 'dragon',
      description: null,
      diet: 'Carnivore',
      dietType: 'CARNIVORE',
      mealsPerDay: 2,
      portionKg: 40,
      dangerLevel: 4,
      tempMinC: 900,
      tempMaxC: 1400,
      humidityMin: 0,
      humidityMax: 10,
      darkness: 20,
      lifespanYears: 400,
      residentCount: 2,
      incompatibleWith: [],
    },
    {
      id: 2,
      name: 'Troll',
      slug: 'troll',
      description: null,
      diet: 'Herbivore',
      dietType: 'HERBIVORE',
      mealsPerDay: 3,
      portionKg: 12,
      dangerLevel: 2,
      tempMinC: 5,
      tempMaxC: 25,
      humidityMin: 40,
      humidityMax: 80,
      darkness: 60,
      lifespanYears: 90,
      residentCount: 1,
      incompatibleWith: [],
    },
  ],
}))

vi.mock('../../hooks/useApi', () => ({
  useApi: () => ({ data: speciesFixture, loading: false, error: null, reload: () => {} }),
}))

afterEach(cleanup)

const renderPage = () =>
  render(
    <MemoryRouter>
      <SpeciesListPage />
    </MemoryRouter>,
  )

const search = (value: string) => fireEvent.change(screen.getByPlaceholderText('Search species...'), { target: { value } })

describe('SpeciesListPage', () => {
  it('lists every species before anyone searches', () => {
    renderPage()
    expect(screen.getByText('Dragon')).toBeTruthy()
    expect(screen.getByText('Troll')).toBeTruthy()
  })

  it('matches the name regardless of case', () => {
    renderPage()
    search('dragon')
    expect(screen.getByText('Dragon')).toBeTruthy()
    expect(screen.queryByText('Troll')).toBeNull()
  })

  it('matches the name when the query is typed in upper case', () => {
    renderPage()
    search('DRAGON')
    expect(screen.getByText('Dragon')).toBeTruthy()
    expect(screen.queryByText('Troll')).toBeNull()
  })

  it('matches the diet regardless of case', () => {
    renderPage()
    search('herbivore')
    expect(screen.getByText('Troll')).toBeTruthy()
    expect(screen.queryByText('Dragon')).toBeNull()
  })
})
