import type { Prisma } from '@prisma/client'
import { prisma } from '../../db/prisma'
import { ConflictError, NotFoundError } from '../../errors/httpErrors'
import type { PageInput } from './bulletin.schema'

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

async function authorsById(ids: number[]) {
  const users = await prisma.user.findMany({ where: { id: { in: [...new Set(ids)] } }, select: { id: true, displayName: true } })
  return new Map(users.map((u) => [u.id, u]))
}

export async function listPages(opts: { kind?: string; includeDrafts: boolean; search?: string }) {
  const where: Prisma.BulletinPageWhereInput = {}
  if (opts.kind) where.kind = opts.kind
  if (!opts.includeDrafts) where.status = 'PUBLISHED'
  if (opts.search) where.OR = [{ title: { contains: opts.search } }, { bodyMd: { contains: opts.search } }]

  const pages = await prisma.bulletinPage.findMany({
    where,
    orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }, { updatedAt: 'desc' }],
    select: { id: true, slug: true, title: true, kind: true, status: true, pinned: true, authorId: true, publishedAt: true, updatedAt: true, bodyMd: true },
  })
  const authors = await authorsById(pages.map((p) => p.authorId))
  return pages.map(({ bodyMd, ...p }) => ({
    ...p,
    author: authors.get(p.authorId) ?? null,
    // first paragraph, for the index
    excerpt: bodyMd.split(/\n\s*\n/)[0].slice(0, 240),
  }))
}

export async function getPage(slug: string, includeDrafts: boolean) {
  const page = await prisma.bulletinPage.findUnique({ where: { slug } })
  if (!page || (!includeDrafts && page.status !== 'PUBLISHED')) throw new NotFoundError('Page')
  const authors = await authorsById([page.authorId])
  return { ...page, author: authors.get(page.authorId) ?? null }
}

export async function createPage(input: PageInput, authorId: number) {
  const slug = input.slug || slugify(input.title)
  if (await prisma.bulletinPage.findUnique({ where: { slug } })) throw new ConflictError('A page with that address already exists')
  return prisma.bulletinPage.create({
    data: {
      slug,
      title: input.title,
      bodyMd: input.bodyMd,
      kind: input.kind,
      pinned: input.pinned ?? false,
      authorId,
      revisions: { create: { title: input.title, bodyMd: input.bodyMd, editedById: authorId } },
    },
  })
}

export async function updatePage(id: number, input: Partial<PageInput>, editorId: number) {
  const page = await prisma.bulletinPage.findUnique({ where: { id } })
  if (!page) throw new NotFoundError('Page')
  const title = input.title ?? page.title
  const bodyMd = input.bodyMd ?? page.bodyMd
  return prisma.$transaction(async (tx) => {
    // every edit keeps the previous version
    if (title !== page.title || bodyMd !== page.bodyMd) {
      await tx.bulletinRevision.create({ data: { pageId: id, title, bodyMd, editedById: editorId } })
    }
    return tx.bulletinPage.update({ where: { id }, data: { title, bodyMd, kind: input.kind, pinned: input.pinned } })
  })
}

export async function setPublished(id: number, published: boolean) {
  const page = await prisma.bulletinPage.findUnique({ where: { id } })
  if (!page) throw new NotFoundError('Page')
  return prisma.bulletinPage.update({
    where: { id },
    data: { status: published ? 'PUBLISHED' : 'DRAFT', publishedAt: published ? (page.publishedAt ?? new Date()) : null },
  })
}

export async function revisions(id: number) {
  const revs = await prisma.bulletinRevision.findMany({ where: { pageId: id }, orderBy: { editedAt: 'desc' } })
  const editors = await authorsById(revs.map((r) => r.editedById))
  return revs.map((r) => ({ ...r, editedBy: editors.get(r.editedById) ?? null }))
}

export async function deletePage(id: number) {
  await prisma.bulletinPage.delete({ where: { id } })
}

