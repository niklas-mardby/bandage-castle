import React from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api'

type State = { monsters: any[]; loading: boolean; search: string; page: number; total: number }

const PAGE_SIZE = 25

export default class MonsterListPage extends React.Component<any, State> {
  state: State = { monsters: [], loading: true, search: '', page: 1, total: 0 }

  componentDidMount() {
    this.load()
  }

  load() {
    let url = '/monsters?page=' + this.state.page + '&size=' + PAGE_SIZE
    if (this.state.search) url += '&search=' + encodeURIComponent(this.state.search)
    apiFetch(url).then((data) => this.setState({ monsters: data.rows, total: data.total, loading: false }))
  }

  onSubmit = (e: any) => {
    e.preventDefault()
    this.setState({ page: 1 }, () => this.load())
  }

  goTo(page: number) {
    this.setState({ page }, () => this.load())
  }

  render() {
    return (
      <div className="page">
        <h2>Monsters</h2>
        <Link to="/monsters/new">+ New monster</Link> | <Link to="/monsters/browse">🔎 Browse with filters</Link>
        <form onSubmit={this.onSubmit}>
          <input placeholder="name or species" value={this.state.search} onChange={(e) => this.setState({ search: e.target.value })} />
          <button type="submit">Search</button>
        </form>
        {this.state.loading ? (
          <p>loading...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Species</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {this.state.monsters.map((m) => (
                <tr key={m.id}>
                  <td>
                    <Link to={'/monsters/' + m.id}>{m.name}</Link>
                  </td>
                  <td>{m.species}</td>
                  <td>{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="pager">
          <button disabled={this.state.page <= 1} onClick={() => this.goTo(this.state.page - 1)}>
            &lt; prev
          </button>
          <span>
            page {this.state.page} of {Math.max(1, Math.ceil(this.state.total / PAGE_SIZE))}
          </span>
          <button disabled={this.state.page * PAGE_SIZE >= this.state.total} onClick={() => this.goTo(this.state.page + 1)}>
            next &gt;
          </button>
        </div>
      </div>
    )
  }
}
