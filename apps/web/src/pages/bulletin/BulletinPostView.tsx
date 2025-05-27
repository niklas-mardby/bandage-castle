import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { hasRole } from '@bandage/shared'
import { apiFetch } from '../../api'
import { useAuth } from '../../auth/AuthProvider'
import { formatDay } from '../../utils/dates'
import type { BulletinPage } from './types'

export default function BulletinPostView() {
  const { slug } = useParams()
  const { user } = useAuth()
  const { data: post, error } = useQuery({ queryKey: ['bulletin-page', slug], queryFn: () => apiFetch(`/bulletin/${slug}`) as Promise<BulletinPage> })

  if (error) return <p className="page error">{(error as Error).message}</p>
  if (!post) return <p className="page">Loading...</p>

  return (
    <div className="page bulletin">
      <Link to="/bulletin">← Bulletin</Link>
      <article>
        <h1>
          {post.pinned && '📌 '}
          {post.title}
        </h1>
        <p className="muted">
          📰 {post.author?.displayName} · {formatDay(post.publishedAt ?? post.createdAt)}
          {hasRole(user, 'SCRIBE', 'ADMIN') && (
            <>
              {' '}
              · <Link to={`/bulletin/edit/${post.id}?slug=${post.slug}`}>edit</Link>
            </>
          )}
        </p>
        <div className="post-body">{post.bodyMd}</div>
      </article>
    </div>
  )
}
