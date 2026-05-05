import React from 'react'
import { apiFetch } from '../api'

// used for both new and edit. pass id prop to edit
type Props = { id?: string }
type State = { form: any; customers: any[]; error: string; saving: boolean }

const EMPTY = { name: '', species: '', owner_id: '', birth_date: '', temperament: '', quirks: '', history: '', status: 'IN_RESIDENCE' }

class MonsterForm extends React.Component<Props, State> {
  state: State = { form: { ...EMPTY }, customers: [], error: '', saving: false }

  componentDidMount() {
    apiFetch('/customers').then((customers) => this.setState({ customers }))
    if (this.props.id) {
      apiFetch('/monsters/' + this.props.id).then((m) => {
        if (m.birth_date) m.birth_date = m.birth_date.slice(0, 10)
        this.setState({ form: m })
      })
    }
  }

  set(field: string, value: any) {
    this.setState({ form: { ...this.state.form, [field]: value } })
  }

  submit = async (e: any) => {
    e.preventDefault()
    if (!this.state.form.name) return this.setState({ error: 'name is required' })
    this.setState({ saving: true })
    try {
      if (this.props.id) {
        await apiFetch('/monsters/' + this.props.id, { method: 'PUT', body: this.state.form })
        window.location.href = '/monsters/' + this.props.id
      } else {
        const r = await apiFetch('/monsters', { method: 'POST', body: this.state.form })
        window.location.href = '/monsters/' + r.id
      }
    } catch (err: any) {
      this.setState({ error: err.message, saving: false })
    }
  }

  render() {
    const f = this.state.form
    return (
      <div className="page">
        <h2>{this.props.id ? 'Edit ' + f.name : 'New monster'}</h2>
        <form className="form" onSubmit={this.submit}>
          <label>Name</label>
          <input value={f.name} onChange={(e) => this.set('name', e.target.value)} />
          <label>Species</label>
          <input value={f.species} onChange={(e) => this.set('species', e.target.value)} />
          <label>Owner</label>
          <select value={f.owner_id || ''} onChange={(e) => this.set('owner_id', e.target.value)}>
            <option value="">(none - castle resident)</option>
            {this.state.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} {c.firstName} {c.lastName}
              </option>
            ))}
          </select>
          <label>Born</label>
          <input type="date" value={f.birth_date || ''} onChange={(e) => this.set('birth_date', e.target.value)} />
          <label>Temperament</label>
          <input value={f.temperament || ''} onChange={(e) => this.set('temperament', e.target.value)} />
          <label>Quirks</label>
          <textarea value={f.quirks || ''} onChange={(e) => this.set('quirks', e.target.value)} />
          <label>History</label>
          <textarea value={f.history || ''} onChange={(e) => this.set('history', e.target.value)} />
          <label>Status</label>
          <select value={f.status} onChange={(e) => this.set('status', e.target.value)}>
            <option value="IN_RESIDENCE">In residence</option>
            <option value="HOME">Home</option>
            <option value="AVAILABLE">Available for hire</option>
            <option value="HIRED">Hired</option>
            <option value="RETIRED">Retired</option>
          </select>
          <div>
            <button type="submit" disabled={this.state.saving}>
              Save
            </button>
          </div>
          {this.state.error && <p className="error">{this.state.error}</p>}
        </form>
      </div>
    )
  }
}

import { useParams } from 'react-router-dom'
export default function MonsterFormPage() {
  const { id } = useParams()
  return <MonsterForm id={id} />
}
