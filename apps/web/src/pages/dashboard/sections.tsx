import { Link } from 'react-router-dom'
import { toGoldString } from '@bandage/shared'
import { useDashboard } from '../../hooks/queries'
import { formatDay } from '../../utils/dates'
import { BarChart, Loading, Section, StatTile } from './widgets'

type Admin = {
  occupancy: { inResidence: number; capacity: number }
  awaitingHire: number
  openTickets: number
  urgentTickets: number
  lowStock: { id: number; name: string; quantity: number; unit: string }[]
  revenue: { month: string; gold: number }[]
}

export function AdminSection() {
  const { data } = useDashboard<Admin>('admin')
  if (!data) return <Loading />
  const pct = data.occupancy.capacity ? Math.round((data.occupancy.inResidence / data.occupancy.capacity) * 100) : 0
  return (
    <Section title="🏰 The castle at a glance">
      <div className="tiles">
        <StatTile icon="🐉" label={`in residence (${pct}% full)`} value={data.occupancy.inResidence} to="/lairs" />
        <StatTile icon="🏛️" label="awaiting hire" value={data.awaitingHire} to="/hiring" />
        <StatTile icon="🎫" label="open tickets" value={data.openTickets} to="/tickets" tone={data.urgentTickets ? 'warn' : undefined} />
        <StatTile icon="📦" label="low on stock" value={data.lowStock.length} to="/supplies" tone={data.lowStock.length ? 'danger' : 'ok'} />
      </div>
      <h4>💰 Revenue, last 12 months</h4>
      <BarChart data={data.revenue.map((r) => ({ label: r.month, value: r.gold }))} format={toGoldString} />
    </Section>
  )
}

type FrontDesk = {
  arrivals: { stayId: number; monster: { id: number; name: string }; reason: string; startDate: string }[]
  departures: { stayId: number; monster: { id: number; name: string }; expectedPickup: string }[]
  pendingApplications: number
  unpaidInvoices: number
  overdueInvoices: number
}

export function FrontDeskSection() {
  const { data } = useDashboard<FrontDesk>('front-desk')
  if (!data) return <Loading />
  return (
    <Section title="🚪 Front desk">
      <div className="tiles">
        <StatTile icon="🛬" label="arriving today/tomorrow" value={data.arrivals.length} to="/intake" />
        <StatTile icon="👋" label="leaving today/tomorrow" value={data.departures.length} to="/stays" />
        <StatTile icon="📜" label="applications to review" value={data.pendingApplications} to="/hiring/applications" />
        <StatTile icon="🧾" label={`unpaid (${data.overdueInvoices} overdue)`} value={data.unpaidInvoices} to="/invoices" tone={data.overdueInvoices ? 'warn' : undefined} />
      </div>
      <div className="split">
        <div>
          <h4>Arrivals</h4>
          <ul>
            {data.arrivals.map((a) => (
              <li key={a.stayId}>
                <Link to={`/stays/${a.stayId}`}>{a.monster.name}</Link> · {a.reason.toLowerCase()} · {formatDay(a.startDate)}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Departures</h4>
          <ul>
            {data.departures.map((d) => (
              <li key={d.stayId}>
                <Link to={`/stays/${d.stayId}`}>{d.monster.name}</Link> · {formatDay(d.expectedPickup)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}

type Keeper = { feeding: { total: number; done: number }; myTickets: { id: number; title: string; priority: string; status: string }[]; fullLairs: { id: number; name: string }[]; lowStock: number }

export function KeeperSection() {
  const { data } = useDashboard<Keeper>('keeper')
  if (!data) return <Loading />
  return (
    <Section title="🧹 Keeper's rounds">
      <div className="tiles">
        <StatTile icon="🍖" label="meals served today" value={`${data.feeding.done}/${data.feeding.total}`} to="/feeding" tone={data.feeding.done === data.feeding.total ? 'ok' : undefined} />
        <StatTile icon="🎫" label="my open tickets" value={data.myTickets.length} to="/tickets" />
        <StatTile icon="🏚️" label="lairs full" value={data.fullLairs.length} to="/lairs" />
        <StatTile icon="📦" label="supplies low" value={data.lowStock} to="/supplies" tone={data.lowStock ? 'danger' : 'ok'} />
      </div>
      <ul>
        {data.myTickets.map((t) => (
          <li key={t.id}>
            <Link to={`/tickets/${t.id}`}>{t.title}</Link> <span className="muted">{t.priority.toLowerCase()}</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function VetSection() {
  const { data } = useDashboard<{ ongoingTreatments: number; activePrescriptions: number; inForTreatment: number }>('vet')
  if (!data) return <Loading />
  return (
    <Section title="🩺 Infirmary">
      <div className="tiles">
        <StatTile icon="🛏️" label="in for treatment" value={data.inForTreatment} to="/vet" />
        <StatTile icon="🩹" label="ongoing treatments" value={data.ongoingTreatments} to="/vet" />
        <StatTile icon="🧪" label="active prescriptions" value={data.activePrescriptions} />
      </div>
    </Section>
  )
}

export function TherapistSection() {
  const { data } = useDashboard<{ activePlans: number; sessionsDue: { planId: number; monster: string; issue: string }[] }>('therapist')
  if (!data) return <Loading />
  return (
    <Section title="🛋️ Therapy">
      <div className="tiles">
        <StatTile icon="📋" label="active plans" value={data.activePlans} to="/therapy" />
        <StatTile icon="⏰" label="sessions due" value={data.sessionsDue.length} tone={data.sessionsDue.length ? 'warn' : 'ok'} />
      </div>
      <ul>
        {data.sessionsDue.map((s) => (
          <li key={s.planId}>
            <Link to={`/therapy/${s.planId}`}>{s.monster}</Link> <span className="muted">{s.issue.toLowerCase().replace(/_/g, ' ')}</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function ScribeSection() {
  const { data } = useDashboard<{ drafts: { id: number; title: string; slug: string }[]; latest: { id: number; title: string; slug: string; kind: string }[] }>('scribe')
  if (!data) return <Loading />
  return (
    <Section title="📜 Bulletin">
      <div className="split">
        <div>
          <h4>Your drafts</h4>
          <ul>
            {data.drafts.map((d) => (
              <li key={d.id}>
                <Link to={`/bulletin/edit/${d.id}?slug=${d.slug}`}>{d.title}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Latest</h4>
          <ul>
            {data.latest.map((p) => (
              <li key={p.id}>
                <Link to={`/bulletin/${p.kind === 'PAGE' ? 'pages' : 'posts'}/${p.slug}`}>{p.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}

type Me = {
  monsters: { id: number; name: string; status: string; species: { name: string } | null; stays: { id: number; status: string; reason: string; expectedPickup: string | null }[] }[]
  unpaidInvoices: { id: number; total: number; dueDate: string | null }[]
  applications: { id: number; status: string; listingId: number; monster: string }[]
}

export function CustomerSection({ overlord }: { overlord: boolean }) {
  const { data } = useDashboard<Me>('me')
  if (!data) return <Loading />
  const owed = data.unpaidInvoices.reduce((s, i) => s + i.total, 0)
  return (
    <>
      <Section title="🐾 Your monsters">
        {data.monsters.length === 0 && <p className="muted">No monsters registered with us yet.</p>}
        <div className="cards">
          {data.monsters.map((m) => {
            const stay = m.stays[0]
            return (
              <Link className="card monster-card" key={m.id} to={`/monsters/${m.id}`}>
                <img src={`/api/monsters/${m.id}/photo`} alt={m.name} width={100} />
                <h4>{m.name}</h4>
                <p className="muted">{m.species?.name}</p>
                {stay ? (
                  <p>
                    {stay.status === 'CHECKED_IN' ? '🏰 staying with us' : '📅 booked'}
                    {stay.expectedPickup && <> · pickup {formatDay(stay.expectedPickup)}</>}
                  </p>
                ) : (
                  <p>🏡 at home</p>
                )}
              </Link>
            )
          })}
        </div>
      </Section>
      <Section title="🧾 Invoices">
        {data.unpaidInvoices.length === 0 ? (
          <p>All paid up. The dragons thank you. 🐉</p>
        ) : (
          <p>
            You owe <b>{toGoldString(owed)}</b> on {data.unpaidInvoices.length} invoice(s). <Link to="/my/invoices">See invoices →</Link>
          </p>
        )}
      </Section>
      {overlord && (
        <Section title="🏛️ Your applications">
          {data.applications.length === 0 ? (
            <p>
              No applications yet. <Link to="/hiring">Browse the Hiring Hall →</Link>
            </p>
          ) : (
            <ul>
              {data.applications.map((a) => (
                <li key={a.id}>
                  <Link to={`/hiring/${a.listingId}`}>{a.monster}</Link> <span className="badge">{a.status.toLowerCase()}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}
    </>
  )
}
