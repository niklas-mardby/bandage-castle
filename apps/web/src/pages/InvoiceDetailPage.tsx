import React from 'react'
import { apiFetch } from '../api'
import { formatGold } from '../money'

type State = { invoice: any; amount: string; method: string; error: string }

class InvoiceDetail extends React.Component<{ id: string }, State> {
  state: State = { invoice: null, amount: '', method: 'GOLD', error: '' }

  componentDidMount() {
    this.load()
  }

  load() {
    apiFetch('/billing/invoices/' + this.props.id).then((invoice) => this.setState({ invoice }))
  }

  pay = async () => {
    try {
      await apiFetch('/billing/invoices/' + this.props.id + '/payments', { method: 'POST', body: { amount: this.state.amount, method: this.state.method } })
      this.setState({ amount: '' })
      this.load()
    } catch (e: any) {
      this.setState({ error: e.message })
    }
  }

  render() {
    const inv = this.state.invoice
    if (!inv) return <p>loading...</p>

    let linesTotal = 0
    inv.lines.forEach((l: any) => {
      linesTotal += l.unit_price
    })
    let paid = 0
    inv.payments.forEach((p: any) => {
      paid += p.amount
    })

    return (
      <div className="page invoice">
        <h2>
          Invoice #{inv.id} {inv.billing_version === 2 && <span className="badge badge-ok">v2 ✨</span>}
        </h2>
        <p>
          To: {inv.title} {inv.first_name} {inv.last_name}
          <br />
          {inv.lair_address}
        </p>
        <p>
          Issued {inv.issued_at && inv.issued_at.slice(0, 10)}, due {inv.due_date && inv.due_date.slice(0, 10)} - <b>{inv.status}</b>
        </p>
        <table className="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l: any) => (
              <tr key={l.id}>
                <td>{l.description}</td>
                <td>{l.qty}</td>
                <td>{formatGold(l.unit_price)}</td>
                <td>{formatGold(l.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>Lines</td>
              <td>{formatGold(linesTotal)}</td>
            </tr>
            <tr>
              <td colSpan={3}>
                <b>Total</b>
              </td>
              <td>
                <b>{formatGold(inv.total)}</b>
              </td>
            </tr>
            <tr>
              <td colSpan={3}>Paid</td>
              <td>{formatGold(paid)}</td>
            </tr>
          </tfoot>
        </table>

        {inv.status === 'UNPAID' && (
          <div className="form">
            <h3>Record payment</h3>
            <input placeholder="amount" value={this.state.amount} onChange={(e) => this.setState({ amount: e.target.value })} />
            <select value={this.state.method} onChange={(e) => this.setState({ method: e.target.value })}>
              <option value="GOLD">Gold</option>
              <option value="GEMS">Gems</option>
              <option value="IOU">IOU</option>
            </select>
            <button onClick={this.pay}>Pay</button>
            {this.state.error && <p className="error">{this.state.error}</p>}
          </div>
        )}
      </div>
    )
  }
}

// wrapper so we can get the id from the router
import { useParams } from 'react-router-dom'
export default function InvoiceDetailPage() {
  const { id } = useParams()
  return <InvoiceDetail id={id as string} />
}
