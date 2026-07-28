// Tickets as a board: one column per status. Moving a card calls the status endpoint.
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../api'
import { Spinner } from '../../components/ui'
import { userName } from '../../utils/format'
import { fromNow } from '../../utils/dates'
import { CATEGORY_ICON, PRIORITY_ICON, STATUS_LABEL, type Ticket } from './types'

const COLUMNS: Ticket['status'][] = ['OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE']

type Page = { items: Ticket[]; nextCursor: number | null }

async function loadAll(): Promise<Ticket[]> {
  // the board shows everything that isn't ancient: the latest 100 tickets
  const page: Page = await apiFetch('/tickets?take=100')
  return page.items
}

export default function TicketBoardPage() {
  const qc = useQueryClient()
  const { data: tickets, isLoading } = useQuery({ queryKey: ['tickets', 'board'], queryFn: loadAll })
  const move = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Ticket['status'] }) => apiFetch(`/tickets/${id}/status`, { method: 'PATCH', body: { status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  })

  if (isLoading || !tickets) return <Spinner />

  return (
    <div className="page">
      <h2>🎫 Ticket board</h2>
      <p>
        <Link to="/tickets">List view</Link> · <Link to="/tickets/new">+ New ticket</Link>
      </p>
      <div className="board">
        {COLUMNS.map((status, col) => {
          const cards = tickets.filter((t) => t.status === status)
          return (
            <section className="board-col" key={status}>
              <h3>
                {STATUS_LABEL[status]} <span className="muted">({cards.length})</span>
              </h3>
              {cards.slice(0, status === 'DONE' ? 15 : undefined).map((t) => (
                <div className={`board-card prio-${t.priority.toLowerCase()}`} key={t.id}>
                  <Link to={`/tickets/${t.id}`}>
                    {CATEGORY_ICON[t.category]} {t.title}
                  </Link>
                  <p className="muted">
                    {PRIORITY_ICON[t.priority]} {userName(t.assignee)} · {fromNow(t.createdAt)}
                  </p>
                  <div className="board-moves">
                    {col > 0 && (
                      <button title={`Move to ${STATUS_LABEL[COLUMNS[col - 1]]}`} onClick={() => move.mutate({ id: t.id, status: COLUMNS[col - 1] })}>
                        ◀
                      </button>
                    )}
                    {col < COLUMNS.length - 1 && (
                      <button title={`Move to ${STATUS_LABEL[COLUMNS[col + 1]]}`} onClick={() => move.mutate({ id: t.id, status: COLUMNS[col + 1] })}>
                        ▶
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </section>
          )
        })}
      </div>
    </div>
  )
}
