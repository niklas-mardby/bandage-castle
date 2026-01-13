import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../api'
import { useApi } from '../../hooks/useApi'
import FeedingOverrides from './FeedingOverrides'

type Entry = {
  time: string
  lairId: number
  lairName: string
  wing: string
  monsterId: number
  monsterName: string
  species: string
  food: string
  portionKg: number
  overrideNote?: string
  fed: boolean
}

type Schedule = {
  date: string
  entries: Entry[]
  shoppingList: { food: string; kg: number }[]
  unknownDiet: { id: number; name: string }[]
}

export default function FeedingPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const { data, error, reload } = useApi<Schedule>(`/feeding/schedule?date=${date}`)

  if (error) return <p className="page error">{error.message}</p>
  if (!data) return <p className="page">Sharpening the cleavers... 🍖</p>

  const toggle = async (e: Entry) => {
    const body = { monsterId: e.monsterId, date: data.date, mealTime: e.time }
    await apiFetch('/feeding/logs', { method: e.fed ? 'DELETE' : 'POST', body })
    reload()
  }

  const times = Array.from(new Set(data.entries.map((e) => e.time)))
  const done = data.entries.filter((e) => e.fed).length

  return (
    <div className="page">
      <h2>🍖 Feeding schedule</h2>
      <div className="toolbar">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <span>
          {done} / {data.entries.length} meals served
        </span>
      </div>

      {data.unknownDiet.length > 0 && (
        <p className="warning">
          ⚠️ No species on file, so no plan for:{' '}
          {data.unknownDiet.map((m) => (
            <Link key={m.id} to={`/monsters/${m.id}`}>
              {m.name}{' '}
            </Link>
          ))}
        </p>
      )}

      <div className="split">
        <div style={{ flex: 1 }}>
          {times.map((time) => (
            <section key={time}>
              <h3>🕰️ {time}</h3>
              <table className="table">
                <tbody>
                  {data.entries
                    .filter((e) => e.time === time)
                    .map((e) => (
                      <tr key={`${e.monsterId}-${e.time}`} className={e.fed ? 'done' : ''}>
                        <td>
                          <input type="checkbox" checked={e.fed} onChange={() => toggle(e)} />
                        </td>
                        <td>
                          <b>{e.monsterName}</b> <span className="muted">{e.species}</span>
                          {e.overrideNote && (
                            <span className="badge" title={e.overrideNote}>
                              ⚙️ override
                            </span>
                          )}
                        </td>
                        <td>{e.lairName}</td>
                        <td>
                          {e.portionKg} kg {e.food}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
        <div className="panel" style={{ maxWidth: 300 }}>
          <h3>🛒 Kitchen list</h3>
          <ul>
            {data.shoppingList.map((s) => (
              <li key={s.food}>
                {s.kg} kg — {s.food}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <FeedingOverrides />
    </div>
  )
}
