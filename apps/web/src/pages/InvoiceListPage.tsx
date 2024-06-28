import React from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api'
import { formatGP } from '../money'
import { formatDay } from '../utils/dates'

type State = { invoices: any[]; loading: boolean; filter: string }

export default class InvoiceListPage extends React.Component<any, State> {
  state: State = { invoices: [], loading: true, filter: '' }

  componentDidMount() {
    apiFetch('/billing/invoices').then((invoices) => this.setState({ invoices, loading: false }))
  }

  render() {
    const invoices = this.state.filter ? this.state.invoices.filter((i) => i.status === this.state.filter) : this.state.invoices
    return (
      <div className="page">
        <h2>Invoices</h2>
        <select value={this.state.filter} onChange={(e) => this.setState({ filter: e.target.value })}>
          <option value="">All</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PAID">Paid</option>
          <option value="VOID">Void</option>
        </select>
        {this.state.loading ? (
          <p>loading...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Issued</th>
                <th>Due</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id}>
                  <td>
                    <Link to={'/invoices/' + i.id}>{i.id}</Link>
                  </td>
                  <td>
                    {i.title} {i.first_name} {i.last_name}
                  </td>
                  <td>{formatDay(i.issued_at)}</td>
                  <td>{formatDay(i.due_date)}</td>
                  <td>{formatGP(i.total)}</td>
                  <td>{i.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }
}
