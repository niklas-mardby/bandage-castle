import React from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api'
import { formatGP } from '../money'
import { formatDay } from '../utils/dates'

type State = { invoices: any[]; loading: boolean }

export default class MyInvoicesPage extends React.Component<any, State> {
  state: State = { invoices: [], loading: true }

  componentDidMount() {
    apiFetch('/billing/invoices?mine=1').then((invoices) => this.setState({ invoices, loading: false }))
  }

  render() {
    if (this.state.loading) return <p>loading...</p>
    const unpaid = this.state.invoices.filter((i) => i.status === 'UNPAID')
    let owed = 0
    unpaid.forEach((i) => (owed += i.total))
    return (
      <div className="page">
        <h2>My invoices</h2>
        {unpaid.length > 0 && (
          <p className="warning">
            You owe <b>{formatGP(owed)}</b> on {unpaid.length} invoice(s).
          </p>
        )}
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Issued</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {this.state.invoices.map((i) => (
              <tr key={i.id}>
                <td>
                  <Link to={'/invoices/' + i.id}>{i.id}</Link>
                </td>
                <td>{formatDay(i.issued_at)}</td>
                <td>{formatGP(i.total)}</td>
                <td>{i.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
}
