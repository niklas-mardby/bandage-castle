import React from 'react'
import { apiFetch } from '../api'

type State = { monsters: any[]; customers: any[]; form: any; error: string }

export default class NewStayPage extends React.Component<any, State> {
  state: State = {
    monsters: [],
    customers: [],
    form: { monster_id: '', customer_id: '', reason: 'BOARDING', start_date: '', expected_pickup: '', daily_rate: 10, notes: '' },
    error: '',
  }

  componentDidMount() {
    apiFetch('/monsters').then((monsters) => this.setState({ monsters }))
    apiFetch('/customers').then((customers) => this.setState({ customers }))
  }

  set(field: string, value: any) {
    this.setState({ form: { ...this.state.form, [field]: value } })
  }

  submit = async (e: any) => {
    e.preventDefault()
    try {
      const r = await apiFetch('/stays', { method: 'POST', body: this.state.form })
      window.location.href = '/stays/' + r.id
    } catch (err: any) {
      this.setState({ error: err.message })
    }
  }

  render() {
    const f = this.state.form
    return (
      <div className="page">
        <h2>New booking</h2>
        <form className="form" onSubmit={this.submit}>
          <label>Monster</label>
          <select value={f.monster_id} onChange={(e) => this.set('monster_id', e.target.value)}>
            <option value="">--</option>
            {this.state.monsters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.species})
              </option>
            ))}
          </select>
          <label>Customer</label>
          <select value={f.customer_id} onChange={(e) => this.set('customer_id', e.target.value)}>
            <option value="">--</option>
            {this.state.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} {c.firstName} {c.lastName}
              </option>
            ))}
          </select>
          <label>Reason</label>
          <select value={f.reason} onChange={(e) => this.set('reason', e.target.value)}>
            <option value="BOARDING">Boarding</option>
            <option value="TREATMENT">Treatment</option>
            <option value="THERAPY">Therapy</option>
            <option value="SURRENDER">Surrender</option>
          </select>
          <label>Start</label>
          <input type="date" value={f.start_date} onChange={(e) => this.set('start_date', e.target.value)} />
          <label>Expected pickup</label>
          <input type="date" value={f.expected_pickup} onChange={(e) => this.set('expected_pickup', e.target.value)} />
          <label>Daily rate (gp)</label>
          <input type="number" step="0.01" value={f.daily_rate} onChange={(e) => this.set('daily_rate', e.target.value)} />
          <label>Notes</label>
          <textarea value={f.notes} onChange={(e) => this.set('notes', e.target.value)} />
          <div>
            <button type="submit">Book</button>
          </div>
          {this.state.error && <p className="error">{this.state.error}</p>}
        </form>
      </div>
    )
  }
}
