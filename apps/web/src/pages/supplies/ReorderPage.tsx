import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../api'
import { Card, EmptyState, Spinner } from '../../components/ui'

type ReorderGroup = {
  supplier: string
  lines: { id: number; name: string; unit: string; quantity: number; lowStockThreshold: number; orderQuantity: number }[]
}

export default function ReorderPage() {
  const { data, isLoading } = useQuery({ queryKey: ['supplies', 'reorder'], queryFn: () => apiFetch('/supplies/reorder') as Promise<ReorderGroup[]> })

  return (
    <div className="page">
      <Link to="/supplies">← Supplies</Link>
      <h2>🛒 Reorder list</h2>
      <p className="muted">
        Everything that is running low, grouped by supplier. We order enough to get back to twice the reorder level.{' '}
        <a href="/api/supplies/reorder?format=csv">⬇️ CSV for the quartermaster</a>
      </p>
      {isLoading && <Spinner />}
      {data?.length === 0 && <EmptyState title="Nothing to order" icon="🎉" />}
      {data?.map((g) => (
        <Card key={g.supplier} title={`📦 ${g.supplier}`}>
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>In stock</th>
                <th>Reorder at</th>
                <th>Order</th>
              </tr>
            </thead>
            <tbody>
              {g.lines.map((l) => (
                <tr key={l.id}>
                  <td>{l.name}</td>
                  <td>
                    {l.quantity} {l.unit}
                  </td>
                  <td>{l.lowStockThreshold}</td>
                  <td>
                    <b>
                      {l.orderQuantity} {l.unit}
                    </b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  )
}
