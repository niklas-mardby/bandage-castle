import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { isStaff } from '@bandage/shared'
import { useAuth } from '../auth/AuthProvider'
import { apiFetch } from '../api'

export default function MonsterDetailPage() {
  const { id } = useParams()
  const [monster, setMonster] = useState<any>(null)
  const [stays, setStays] = useState<any[]>([])
  const [error, setError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    apiFetch('/monsters/' + id)
      .then(setMonster)
      .catch((e) => setError(e.message))
    apiFetch('/stays?monster_id=' + id).then(setStays)
  }, [id])

  if (error) return <p className="error">{error}</p>
  if (!monster) return <p>loading...</p>

  return (
    <div className="page monster">
      <div className="monster-header">
        <img src={'/api/monsters/' + monster.id + '/photo'} alt={monster.name} width={160} />
        <div>
          <h2>{monster.name}</h2>
          <p>
            {monster.species} &middot; {monster.age != null ? monster.age + ' years old' : 'age unknown'}
          </p>
          <p>Status: {monster.status}</p>
          <p>Temperament: {monster.temperament}</p>
          {isStaff(user) && (
            <>
              <Link to={'/monsters/' + monster.id + '/edit'}>edit</Link> | <Link to={'/monsters/' + monster.id + '/medical'}>medical history</Link> |{' '}
              <Link to={'/monsters/' + monster.id + '/profile'}>full profile ✨</Link>
            </>
          )}
        </div>
      </div>
      <h3>Quirks</h3>
      <p>{monster.quirks || '-'}</p>
      <h3>History</h3>
      <p>{monster.history || '-'}</p>
      <h3>Stays</h3>
      <ul>
        {stays.map((s) => (
          <li key={s.id}>
            <Link to={'/stays/' + s.id}>
              #{s.id} {s.reason}
            </Link>{' '}
            {s.start_date && s.start_date.slice(0, 10)} - {s.status}
          </li>
        ))}
      </ul>
    </div>
  )
}
