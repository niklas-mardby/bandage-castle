import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../api'
import { useApi } from '../../hooks/useApi'

type Supply = {
  id: number
  name: string
  category: string
  unit: string
  quantity: number
  lowStockThreshold: number
  supplier: string | null
  isLow: boolean
}

const CATEGORY_ICON: Record<string, string> = {
  FOOD: '🍖',
  POTION: '🧪',
  BANDAGE: '🩹',
  BEDDING: '🛏️',
  CLEANING: '🧽',
  OTHER: '📦',
}

function MovementForm({ supply, onDone }: { supply: Supply; onDone: () => void }) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('USED')
  const [error, setError] = useState('')

  const save = async () => {
    setError('')
    try {
      await apiFetch(`/supplies/${supply.id}/movements`, { method: 'POST', body: { amount: Number(amount), reason } })
      setAmount('')
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    }
  }

  return (
    <span className="movement">
      <input className="small" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={supply.unit} />
      <select value={reason} onChange={(e) => setReason(e.target.value)}>
        <option value="USED">used</option>
        <option value="DELIVERY">delivered</option>
        <option value="SPOILED">spoiled</option>
        <option value="ADJUSTMENT">adjust (±)</option>
      </select>
      <button disabled={!amount || isNaN(Number(amount))} onClick={save}>
        OK
      </button>
      {error && <span className="error"> {error}</span>}
    </span>
  )
}

function NewSupplyForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [s, setS] = useState({ name: '', category: 'FOOD', unit: 'kg', quantity: '0', lowStockThreshold: '', supplier: '' })
  const [error, setError] = useState('')

  if (!open) return <button onClick={() => setOpen(true)}>+ New supply</button>

  const save = async () => {
    setError('')
    try {
      await apiFetch('/supplies', {
        method: 'POST',
        body: { ...s, quantity: Number(s.quantity), lowStockThreshold: Number(s.lowStockThreshold), supplier: s.supplier || null },
      })
      setOpen(false)
      setS({ name: '', category: 'FOOD', unit: 'kg', quantity: '0', lowStockThreshold: '', supplier: '' })
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    }
  }

  return (
    <div className="form inline wrap">
      <input placeholder="name" value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} />
      <select value={s.category} onChange={(e) => setS({ ...s, category: e.target.value })}>
        {Object.keys(CATEGORY_ICON).map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <input className="small" placeholder="unit" value={s.unit} onChange={(e) => setS({ ...s, unit: e.target.value })} />
      <input className="small" placeholder="qty" value={s.quantity} onChange={(e) => setS({ ...s, quantity: e.target.value })} />
      <input className="small" placeholder="reorder at" value={s.lowStockThreshold} onChange={(e) => setS({ ...s, lowStockThreshold: e.target.value })} />
      <input placeholder="supplier" value={s.supplier} onChange={(e) => setS({ ...s, supplier: e.target.value })} />
      <button onClick={save}>Add</button>
      <button onClick={() => setOpen(false)}>Cancel</button>
      {error && <span className="error">{error}</span>}
    </div>
  )
}

export default function SuppliesPage() {
  const [category, setCategory] = useState('')
  const { data: supplies, error, reload } = useApi<Supply[]>(`/supplies${category ? `?category=${category}` : ''}`)

  if (error) return <p className="page error">{error.message}</p>
  if (!supplies) return <p className="page">Counting bandages... 🩹</p>

  const low = supplies.filter((s) => s.isLow)

  return (
    <div className="page">
      <h2>📦 Supplies</h2>
      <Link to="/supplies/reorder">🛒 Reorder list →</Link>
      {low.length > 0 && (
        <div className="warning">
          ⚠️ Running low on: {low.map((s) => `${s.name} (${s.quantity} ${s.unit})`).join(', ')}
        </div>
      )}
      <div className="toolbar">
        <NewSupplyForm onCreated={reload} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {Object.entries(CATEGORY_ICON).map(([c, icon]) => (
            <option key={c} value={c}>
              {icon} {c.toLowerCase()}
            </option>
          ))}
        </select>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th />
            <th>Item</th>
            <th>In stock</th>
            <th>Reorder at</th>
            <th>Supplier</th>
            <th>Record</th>
          </tr>
        </thead>
        <tbody>
          {supplies.map((s) => (
            <tr key={s.id} className={s.isLow ? 'low' : ''}>
              <td>{CATEGORY_ICON[s.category]}</td>
              <td>{s.name}</td>
              <td>
                {s.quantity} {s.unit} {s.isLow && <span className="badge badge-danger">low</span>}
              </td>
              <td>
                {s.lowStockThreshold} {s.unit}
              </td>
              <td className="muted">{s.supplier}</td>
              <td>
                <MovementForm supply={s} onDone={reload} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
