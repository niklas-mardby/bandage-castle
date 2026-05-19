import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toGoldString } from '@bandage/shared'
import { apiFetch } from '../../api'
import { Card, DataTable, Spinner, Tabs, type Column } from '../../components/ui'
import { BarChart } from '../dashboard/widgets'

type Tab = 'occupancy' | 'revenue' | 'stays' | 'customers' | 'hiring'

type Occupancy = { capacity: number; days: { day: string; total: number; byReason: Record<string, number> }[] }
type RevenueRow = { reason: string; gold: number; invoices: number }
type StaysRow = { month: string; total: number; byReason: Record<string, number> }
type TopCustomer = { customerId: number; name: string; invoices: number; gold: number }
type AvgStay = { reason: string; stays: number; averageNights: number; latePickupPercent: number }
type Hiring = { openListings: number; signedContracts: number; averageDaysToHire: number | null; feeGoldTotal: number; byQuarter: { quarter: string; contracts: number }[] }

const REASON_ICON: Record<string, string> = { BOARDING: '🏖️', TREATMENT: '🩹', THERAPY: '🛋️', SURRENDER: '🦴', OTHER: '📄' }

function CsvLink({ path }: { path: string }) {
  return (
    <a className="csv-link" href={`/api/reports-v2/${path}${path.includes('?') ? '&' : '?'}format=csv`}>
      ⬇️ CSV
    </a>
  )
}

function OccupancyReport() {
  const { data } = useQuery({ queryKey: ['reports', 'occupancy'], queryFn: () => apiFetch('/reports-v2/occupancy') as Promise<Occupancy> })
  if (!data) return <Spinner />
  const peak = Math.max(...data.days.map((d) => d.total))
  const avg = Math.round((data.days.reduce((s, d) => s + d.total, 0) / data.days.length) * 10) / 10
  return (
    <Card title="🏰 Occupancy, last 90 nights" actions={<CsvLink path="occupancy" />}>
      <p>
        Capacity <b>{data.capacity}</b> · average <b>{avg}</b> · peak <b>{peak}</b> ({Math.round((peak / Math.max(1, data.capacity)) * 100)}%)
      </p>
      <BarChart data={data.days.map((d) => ({ label: d.day, value: d.total }))} format={(n) => `${n} monsters`} />
    </Card>
  )
}

function RevenueReport() {
  const [year, setYear] = useState(new Date().getFullYear())
  const { data } = useQuery({ queryKey: ['reports', 'revenue', year], queryFn: () => apiFetch(`/reports-v2/revenue-by-reason?year=${year}`) as Promise<RevenueRow[]> })
  const total = (data ?? []).reduce((s, r) => s + r.gold, 0)
  const columns: Column<RevenueRow>[] = [
    { key: 'reason', header: 'Reason', render: (r) => `${REASON_ICON[r.reason] ?? ''} ${r.reason.toLowerCase()}` },
    { key: 'invoices', header: 'Invoices', render: (r) => r.invoices, sortValue: (r) => r.invoices },
    { key: 'gold', header: 'Invoiced', render: (r) => toGoldString(r.gold), sortValue: (r) => r.gold },
    { key: 'share', header: 'Share', render: (r) => `${total ? Math.round((r.gold / total) * 100) : 0}%` },
  ]
  return (
    <Card
      title={
        <>
          💰 Revenue by reason{' '}
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[0, 1, 2, 3, 4].map((i) => {
              const y = new Date().getFullYear() - i
              return <option key={y}>{y}</option>
            })}
          </select>
        </>
      }
      actions={<CsvLink path={`revenue-by-reason?year=${year}`} />}
    >
      {data ? <DataTable rows={data} columns={columns} rowKey={(r) => r.reason} initialSort={{ key: 'gold', dir: 'desc' }} /> : <Spinner />}
      <p>
        Total: <b>{toGoldString(total)}</b>
      </p>
    </Card>
  )
}

function StaysReport() {
  const { data } = useQuery({ queryKey: ['reports', 'stays-per-month'], queryFn: () => apiFetch('/reports-v2/stays-per-month?months=24') as Promise<StaysRow[]> })
  const { data: avg } = useQuery({ queryKey: ['reports', 'average-stay'], queryFn: () => apiFetch('/reports-v2/average-stay') as Promise<AvgStay[]> })
  return (
    <>
      <Card title="🛏️ New stays per month" actions={<CsvLink path="stays-per-month?months=24" />}>
        {data ? <BarChart data={data.map((d) => ({ label: d.month + '-01', value: d.total }))} format={(n) => `${n} stays`} /> : <Spinner />}
      </Card>
      <Card title="⏳ How long do monsters stay?" actions={<CsvLink path="average-stay" />}>
        <table className="table">
          <thead>
            <tr>
              <th>Reason</th>
              <th>Stays</th>
              <th>Average nights</th>
              <th>Picked up late</th>
            </tr>
          </thead>
          <tbody>
            {avg?.map((a) => (
              <tr key={a.reason}>
                <td>
                  {REASON_ICON[a.reason]} {a.reason.toLowerCase()}
                </td>
                <td>{a.stays}</td>
                <td>{a.averageNights}</td>
                <td>{a.latePickupPercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}

function CustomersReport() {
  const { data } = useQuery({ queryKey: ['reports', 'top-customers'], queryFn: () => apiFetch('/reports-v2/top-customers?limit=15') as Promise<TopCustomer[]> })
  const columns: Column<TopCustomer>[] = [
    { key: 'rank', header: '#', render: (c) => (data ? data.indexOf(c) + 1 : ''), width: '40px' },
    { key: 'name', header: 'Customer', render: (c) => <Link to={`/customers/${c.customerId}`}>{c.name}</Link> },
    { key: 'invoices', header: 'Invoices', render: (c) => c.invoices, sortValue: (c) => c.invoices },
    { key: 'gold', header: 'Invoiced', render: (c) => toGoldString(c.gold), sortValue: (c) => c.gold },
  ]
  return (
    <Card title="👑 Best customers (all time)" actions={<CsvLink path="top-customers?limit=15" />}>
      {data ? <DataTable rows={data} columns={columns} rowKey={(c) => c.customerId} /> : <Spinner />}
    </Card>
  )
}

function HiringReport() {
  const { data } = useQuery({ queryKey: ['reports', 'hiring'], queryFn: () => apiFetch('/reports-v2/hiring') as Promise<Hiring> })
  if (!data) return <Spinner />
  return (
    <Card title="🏛️ Hiring Hall">
      <div className="tiles">
        <div className="stat-tile">
          <span className="stat-value">{data.openListings}</span>
          <span className="stat-label">open listings</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{data.signedContracts}</span>
          <span className="stat-label">monsters hired</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{data.averageDaysToHire ?? '—'}</span>
          <span className="stat-label">days from listing to contract</span>
        </div>
        <div className="stat-tile">
          <span className="stat-value">{toGoldString(data.feeGoldTotal)}</span>
          <span className="stat-label">in hiring fees</span>
        </div>
      </div>
      <BarChart data={data.byQuarter.map((q) => ({ label: `${q.quarter}`, value: q.contracts }))} format={(n) => `${n} contracts`} />
    </Card>
  )
}

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('occupancy')
  return (
    <div className="page">
      <h2>📊 Reports</h2>
      <p className="muted">
        Looking for the old reports and the accountant's CSV? <Link to="/reports/classic">Classic reports →</Link>
      </p>
      <Tabs<Tab>
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'occupancy', label: '🏰 Occupancy' },
          { key: 'revenue', label: '💰 Revenue' },
          { key: 'stays', label: '🛏️ Stays' },
          { key: 'customers', label: '👑 Customers' },
          { key: 'hiring', label: '🏛️ Hiring' },
        ]}
      />
      {tab === 'occupancy' && <OccupancyReport />}
      {tab === 'revenue' && <RevenueReport />}
      {tab === 'stays' && <StaysReport />}
      {tab === 'customers' && <CustomersReport />}
      {tab === 'hiring' && <HiringReport />}
    </div>
  )
}
