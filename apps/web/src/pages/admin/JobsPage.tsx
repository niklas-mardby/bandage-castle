import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../api'
import { Button, Card, Spinner, StatusBadge } from '../../components/ui'
import { formatDateTime } from '../../utils/dates'

type JobsResponse = {
  jobs: { name: string; description: string; afterHour: number }[]
  runs: { id: number; name: string; runDate: string; startedAt: string; finishedAt: string | null; status: string; summary: string | null }[]
}

export default function JobsPage() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['jobs'], queryFn: () => apiFetch('/jobs') as Promise<JobsResponse> })
  const run = useMutation({ mutationFn: (name: string) => apiFetch(`/jobs/${name}/run`, { method: 'POST' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }) })

  if (!data) return <Spinner />
  return (
    <div className="page">
      <h2>⏰ Daily jobs</h2>
      <p className="muted">Reminders the castle sends by itself once a day. "Run now" sends them again.</p>
      <Card title="Jobs">
        <table className="table">
          <tbody>
            {data.jobs.map((j) => {
              const last = data.runs.find((r) => r.name === j.name)
              return (
                <tr key={j.name}>
                  <td>
                    <code>{j.name}</code>
                  </td>
                  <td>{j.description}</td>
                  <td className="muted">after {String(j.afterHour).padStart(2, '0')}:00</td>
                  <td>{last ? <StatusBadge status={last.status === 'OK' ? 'DONE' : last.status === 'FAILED' ? 'BLOCKED' : 'IN_PROGRESS'} /> : <span className="muted">never</span>}</td>
                  <td>
                    <Button loading={run.isPending && run.variables === j.name} onClick={() => run.mutate(j.name)}>
                      Run now
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
      <Card title="Recent runs">
        <table className="table">
          <tbody>
            {data.runs.map((r) => (
              <tr key={r.id}>
                <td>{formatDateTime(r.startedAt)}</td>
                <td>
                  <code>{r.name}</code>
                </td>
                <td>{r.status}</td>
                <td className="muted">{r.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
