export type BulletinSummary = {
  id: number
  slug: string
  title: string
  kind: 'PAGE' | 'POST'
  status: 'DRAFT' | 'PUBLISHED'
  pinned: boolean
  publishedAt: string | null
  updatedAt: string
  author: { id: number; displayName: string | null } | null
  excerpt: string
}

export type BulletinPage = Omit<BulletinSummary, 'excerpt'> & {
  bodyMd: string
  createdAt: string
}

export type Revision = {
  id: number
  title: string
  bodyMd: string
  editedAt: string
  editedBy: { id: number; displayName: string | null } | null
}

export function bulletinPath(p: { kind: 'PAGE' | 'POST'; slug: string }) {
  return p.kind === 'PAGE' ? `/bulletin/pages/${p.slug}` : `/bulletin/posts/${p.slug}`
}
