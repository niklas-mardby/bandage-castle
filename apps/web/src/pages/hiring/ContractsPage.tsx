import { Link } from 'react-router-dom'
import { hasRole, toGoldString } from '@bandage/shared'
import { apiFetch } from '../../api'
import { useAuth } from '../../auth/AuthProvider'
import { useApi } from '../../hooks/useApi'

type Contract = {
  id: number
  reference: string
  fee: number
  startDate: string
  terms: string
  signedAt: string | null
  createdAt: string
  application: { listing: { id: number; title: string; monster: { id: number; name: string } } }
}

export default function ContractsPage() {
  const { user } = useAuth()
  const { data: contracts, reload } = useApi<Contract[]>('/hiring/contracts')
  const isOverlord = hasRole(user, 'OVERLORD')

  const sign = async (id: number) => {
    if (!window.confirm('Sign this contract? This is binding (magically, too).')) return
    await apiFetch(`/hiring/contracts/${id}/sign`, { method: 'POST' })
    reload()
  }

  return (
    <div className="page">
      <h2>🖋️ {isOverlord ? 'My contracts' : 'Hire contracts'}</h2>
      {contracts?.length === 0 && <p className="muted">No contracts yet.</p>}
      {contracts?.map((c) => (
        <div className="card wide parchment" key={c.id}>
          <h3>
            {c.reference} — <Link to={`/hiring/${c.application.listing.id}`}>{c.application.listing.monster.name}</Link>
          </h3>
          <p>
            Fee <b>{toGoldString(c.fee)}</b>, starting {c.startDate.slice(0, 10)}
          </p>
          <pre className="terms">{c.terms}</pre>
          <Link to={`/hiring/contracts/${c.id}/print`}>🖨️ Printable version</Link>
          {c.signedAt ? (
            <p className="success">✍️ Signed {c.signedAt.slice(0, 10)}</p>
          ) : isOverlord ? (
            <button onClick={() => sign(c.id)}>✍️ Sign contract</button>
          ) : (
            <p className="muted">Waiting for signature</p>
          )}
        </div>
      ))}
    </div>
  )
}
