import React from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api'

type State = { stays: any[]; status: string; loading: boolean }

function day(d: string | null) {
  if (!d) return '-'
  return d.slice(0, 10)
}

export default class StayListPage extends React.Component<any, State> {
  state: State = { stays: [], status: '', loading: true }

  componentDidMount() {
    this.load()
  }

  load() {
    this.setState({ loading: true })
    apiFetch('/stays' + (this.state.status ? '?status=' + this.state.status : '')).then((stays) => this.setState({ stays, loading: false }))
  }

  render() {
    return (
      <div className="page">
        <h2>Stays</h2>
        <Link to="/stays/new">+ New booking</Link> | <Link to="/stays/calendar">📅 Calendar</Link>
        <div>
          <select value={this.state.status} onChange={(e) => this.setState({ status: e.target.value }, () => this.load())}>
            <option value="">All</option>
            <option value="BOOKED">Booked</option>
            <option value="CHECKED_IN">Checked in</option>
            <option value="CHECKED_OUT">Checked out</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        {this.state.loading ? (
          <p>loading...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Monster</th>
                <th>Customer</th>
                <th>Reason</th>
                <th>From</th>
                <th>Pickup</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {this.state.stays.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link to={'/stays/' + s.id}>{s.id}</Link>
                  </td>
                  <td>{s.monster_name}</td>
                  <td>
                    {s.first_name} {s.last_name}
                  </td>
                  <td>{s.reason}</td>
                  <td>{day(s.start_date)}</td>
                  <td>{day(s.expected_pickup)}</td>
                  <td>{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }
}
