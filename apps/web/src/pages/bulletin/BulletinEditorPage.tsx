import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../api'
import Markdown from '../../components/Markdown'
import { formatDateTime } from '../../utils/dates'
import { bulletinPath, type BulletinPage, type Revision } from './types'

type Draft = { title: string; bodyMd: string; kind: 'PAGE' | 'POST'; pinned: boolean }

const EMPTY: Draft = { title: '', bodyMd: '', kind: 'POST', pinned: false }

export default function BulletinEditorPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const slug = params.get('slug')
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isNew = !id
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [tab, setTab] = useState<'write' | 'preview' | 'history'>('write')

  const { data: page } = useQuery({
    queryKey: ['bulletin-page', slug],
    queryFn: () => apiFetch(`/bulletin/${slug}`) as Promise<BulletinPage>,
    enabled: !isNew && !!slug,
  })
  const { data: revisions } = useQuery({
    queryKey: ['bulletin-revisions', id],
    queryFn: () => apiFetch(`/bulletin/${id}/revisions`) as Promise<Revision[]>,
    enabled: !isNew && tab === 'history',
  })

  useEffect(() => {
    if (page) setDraft({ title: page.title, bodyMd: page.bodyMd, kind: page.kind, pinned: page.pinned })
  }, [page])

  const save = useMutation({
    mutationFn: (): Promise<BulletinPage> =>
      isNew ? apiFetch('/bulletin', { method: 'POST', body: draft }) : apiFetch(`/bulletin/${id}`, { method: 'PATCH', body: draft }),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ['bulletin'] })
      qc.invalidateQueries({ queryKey: ['bulletin-page', saved.slug] })
      if (isNew) navigate(`/bulletin/edit/${saved.id}?slug=${saved.slug}`, { replace: true })
    },
  })

  const publish = useMutation({
    mutationFn: (published: boolean) => apiFetch(`/bulletin/${id}/publish`, { method: 'POST', body: { published } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bulletin'] })
      qc.invalidateQueries({ queryKey: ['bulletin-page', slug] })
    },
  })

  return (
    <div className="page">
      <h2>✍️ {isNew ? 'New Bulletin entry' : `Editing: ${page?.title ?? '...'}`}</h2>
      <div className="form">
        <label>Title</label>
        <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <div className="toolbar">
          <label>
            <input type="radio" checked={draft.kind === 'POST'} onChange={() => setDraft({ ...draft, kind: 'POST' })} /> 📰 News post
          </label>
          <label>
            <input type="radio" checked={draft.kind === 'PAGE'} onChange={() => setDraft({ ...draft, kind: 'PAGE' })} /> 📘 Page
          </label>
          <label>
            <input type="checkbox" checked={draft.pinned} onChange={(e) => setDraft({ ...draft, pinned: e.target.checked })} /> 📌 Pinned
          </label>
        </div>
        <div className="tabs">
          <button className={tab === 'write' ? 'active' : ''} onClick={() => setTab('write')}>
            Write
          </button>
          <button className={tab === 'preview' ? 'active' : ''} onClick={() => setTab('preview')}>
            Preview
          </button>
          {!isNew && (
            <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
              History
            </button>
          )}
        </div>
        {tab === 'write' && <textarea className="editor" rows={18} value={draft.bodyMd} onChange={(e) => setDraft({ ...draft, bodyMd: e.target.value })} placeholder="Markdown welcome: **bold**, _italic_, lists, links..." />}
        {tab === 'preview' && <Markdown source={draft.bodyMd || '_Nothing to preview yet._'} className="preview" />}
        {tab === 'history' && (
          <ul>
            {revisions?.map((r) => (
              <li key={r.id}>
                {formatDateTime(r.editedAt)} by {r.editedBy?.displayName ?? 'unknown'} — <i>{r.title}</i>{' '}
                <button className="link" onClick={() => setDraft({ ...draft, title: r.title, bodyMd: r.bodyMd })}>
                  restore
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="toolbar">
          <button disabled={draft.title.trim().length < 3 || save.isPending} onClick={() => save.mutate()}>
            💾 Save
          </button>
          {!isNew && page?.status === 'DRAFT' && <button onClick={() => publish.mutate(true)}>📣 Publish</button>}
          {!isNew && page?.status === 'PUBLISHED' && <button onClick={() => publish.mutate(false)}>Unpublish</button>}
          {!isNew && page && <button onClick={() => navigate(bulletinPath(page))}>View</button>}
        </div>
        {save.error && <p className="error">{(save.error as Error).message}</p>}
      </div>
    </div>
  )
}
