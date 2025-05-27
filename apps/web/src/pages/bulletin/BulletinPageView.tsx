import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { hasRole } from '@bandage/shared'
import { apiFetch } from '../../api'
import { useAuth } from '../../auth/AuthProvider'
import Markdown from '../../components/Markdown'
import { formatDateTime } from '../../utils/dates'
import type { BulletinPage } from './types'

export default function BulletinPageView() {
  const { slug } = useParams()
  const { user } = useAuth()
  const { data: page, error } = useQuery({ queryKey: ['bulletin-page', slug], queryFn: () => apiFetch(`/bulletin/${slug}`) as Promise<BulletinPage> })

  if (error) return <p className="page error">{(error as Error).message}</p>
  if (!page) return <p className="page">Loading...</p>

  return (
    <div className="page bulletin">
      <Link to="/bulletin">← Bulletin</Link>
      <h1>
        {page.title} {page.status === 'DRAFT' && <span className="badge badge-warn">draft</span>}
      </h1>
      <p className="muted">
        📘 {page.author?.displayName} · last updated {formatDateTime(page.updatedAt)}
        {hasRole(user, 'SCRIBE', 'ADMIN') && (
          <>
            {' '}
            · <Link to={`/bulletin/edit/${page.id}?slug=${page.slug}`}>edit</Link>
          </>
        )}
      </p>
      <Markdown source={page.bodyMd} />
    </div>
  )
}
