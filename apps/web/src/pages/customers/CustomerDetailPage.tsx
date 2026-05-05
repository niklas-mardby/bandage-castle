import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toGoldString } from '@bandage/shared'
import { apiFetch } from '../../api'
import { Button, Card, ErrorMessage, Spinner, StatusBadge, Tabs } from '../../components/ui'
import { formatDay } from '../../utils/dates'
import CustomerForm, { toPayload, type CustomerFormValue } from './CustomerForm'
import { CONTACT_ICON, type CustomerDetail } from './types'

type Tab = 'monsters' | 'stays' | 'invoices'

export default function CustomerDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('monsters')
  const [editing, setEditing] = useState(false)
  const key = ['customer', Number(id)]
  const { data: c, error, isLoading } = useQuery({ queryKey: key, queryFn: () => apiFetch(`/customers/${id}`) as Promise<CustomerDetail> })

  const save = useMutation({
    mutationFn: (v: CustomerFormValue) => apiFetch(`/customers/${id}`, { method: 'PUT', body: toPayload(v) }),
    onSuccess: () => {
      setEditing(false)
      qc.invalidateQueries({ queryKey: key })
      qc.invalidateQueries({ queryKey: ['customers'] })
    },
  })

  if (isLoading) return <Spinner />
  if (error || !c) return <ErrorMessage error={error ?? 'Not found'} />

  const unpaid = c.invoices.filter((i) => i.status === 'UNPAID')

  return (
    <div className="page">
      <Link to="/customers">← Customers</Link>
      <h2>{c.name}</h2>
      <p className="muted">
        {c.contactPref && `${CONTACT_ICON[c.contactPref]} prefers ${c.contactPref}`} · {c.email ?? 'no email'} · {c.ravensSent} ravens sent
        {c.user && <> · 🔑 has a login ({c.user.email})</>}
      </p>

      <Card title="📍 Details" actions={!editing && <Button onClick={() => setEditing(true)}>Edit</Button>}>
        {editing ? (
          <CustomerForm
            initial={{
              title: c.title ?? '',
              firstName: c.firstName ?? '',
              lastName: c.lastName ?? '',
              email: c.email ?? '',
              contactPref: c.contactPref ?? 'raven',
              lairAddress: c.lairAddress ?? '',
              notes: c.notes ?? '',
            }}
            submitLabel="Save"
            saving={save.isPending}
            error={save.error}
            onSubmit={(v) => save.mutate(v)}
          />
        ) : (
          <>
            <p>
              <b>Lair:</b> {c.lairAddress ?? '—'}
            </p>
            {c.notes && <p className="description">{c.notes}</p>}
          </>
        )}
      </Card>

      {unpaid.length > 0 && (
        <p className="warning">
          ⚠️ {unpaid.length} unpaid invoice(s), {toGoldString(unpaid.reduce((s, i) => s + i.total, 0))} in total.
        </p>
      )}

      <Tabs<Tab>
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'monsters', label: '🐉 Monsters', count: c.monsters.length },
          { key: 'stays', label: '🛏️ Stays', count: c.stays.length },
          { key: 'invoices', label: '💰 Invoices', count: c.invoices.length },
        ]}
      />

      {tab === 'monsters' && (
        <ul>
          {c.monsters.map((m) => (
            <li key={m.id}>
              <Link to={`/monsters/${m.id}`}>{m.name}</Link> <span className="muted">{m.species?.name}</span> <StatusBadge status={m.status} />
            </li>
          ))}
        </ul>
      )}
      {tab === 'stays' && (
        <table className="table">
          <tbody>
            {c.stays.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link to={`/stays/${s.id}`}>#{s.id}</Link>
                </td>
                <td>{s.monster.name}</td>
                <td>{s.reason.toLowerCase()}</td>
                <td>
                  {formatDay(s.startDate)} → {formatDay(s.expectedPickup)}
                </td>
                <td>
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {tab === 'invoices' && (
        <table className="table">
          <tbody>
            {c.invoices.map((i) => (
              <tr key={i.id}>
                <td>
                  <Link to={`/invoices/${i.id}`}>#{i.id}</Link>
                </td>
                <td>{formatDay(i.issuedAt)}</td>
                <td>{toGoldString(i.total)}</td>
                <td>
                  <StatusBadge status={i.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
