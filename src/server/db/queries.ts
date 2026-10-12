import { and, asc, count, desc, eq, ilike, inArray, isNotNull, ne, notInArray, or, sql } from 'drizzle-orm'
import { db } from './index'
import { categories, pages, recordCategories, records, submissions, users } from './schema'

/** First image attached to a record (migrated featured image), as a storage key. */
// NB: fully-qualified "records"."id" on purpose — Drizzle drops the table prefix in single-table
// selects, and an unqualified "id" would bind to media.id inside this subquery.
const imageKey = sql<string | null>`(select m.storage_key from media m where m.record_id = "records"."id" order by m.created_at limit 1)`.as('image_key')
const imageWidth = sql<number | null>`(select m.width from media m where m.record_id = "records"."id" order by m.created_at limit 1)`.as('image_width')
const imageHeight = sql<number | null>`(select m.height from media m where m.record_id = "records"."id" order by m.created_at limit 1)`.as('image_height')

// Display category for cards; WordPress catch-alls read as a generic label instead.
const categoryName = sql<string | null>`(select c.name from categories c where c.id = "records"."category_id" and c.slug not in ('uncategorized','achievers','featured'))`.as('category_name')

const cardFields = {
  id: records.id,
  slug: records.slug,
  title: records.title,
  holderName: records.holderName,
  description: records.description,
  publishedAt: records.publishedAt,
  imageKey,
  categoryName,
}

export type RecordCardRow = {
  id: string; slug: string; title: string; holderName: string; description: string
  publishedAt: Date | null; imageKey: string | null; categoryName: string | null
}

export const PAGE_SIZE = 24

/** Published records, newest first, optionally filtered by category slug. */
export async function getPublishedRecords(opts: { limit?: number; offset?: number; categorySlug?: string; q?: string } = {}) {
  const { limit = PAGE_SIZE, offset = 0, categorySlug, q } = opts
  if (!db) return { rows: [] as RecordCardRow[], total: 0 }

  // Free-text search over title + holder name. LIKE wildcards in user input are escaped.
  const pat = q ? `%${q.replace(/[\\%_]/g, (m) => '\\' + m)}%` : null
  const where = and(
    isNotNull(records.publishedAt),
    categorySlug ? inArray(records.id,
        db.select({ id: recordCategories.recordId }).from(recordCategories)
          .innerJoin(categories, eq(categories.id, recordCategories.categoryId))
          .where(eq(categories.slug, categorySlug))) : undefined,
    pat ? or(ilike(records.title, pat), ilike(records.holderName, pat)) : undefined,
  )

  const [rows, totals] = await Promise.all([
    db.select(cardFields).from(records).where(where)
      .orderBy(desc(records.publishedAt), asc(records.slug)).limit(limit).offset(offset),
    db.select({ n: count() }).from(records).where(where),
  ])
  return { rows: rows as RecordCardRow[], total: Number(totals[0]?.n ?? 0) }
}

export async function getFeaturedRecords(limit = 6) {
  if (!db) return [] as RecordCardRow[]
  return db.select(cardFields).from(records)
    .where(isNotNull(records.publishedAt))
    .orderBy(desc(records.featured), desc(records.publishedAt))
    .limit(limit) as Promise<RecordCardRow[]>
}

/** Other published records sharing the record's primary category (falls back to latest). */
export async function getRelatedRecords(recordId: string, categoryId: string, limit = 3) {
  if (!db) return [] as RecordCardRow[]
  const same = await db.select(cardFields).from(records)
    .where(and(isNotNull(records.publishedAt), eq(records.categoryId, categoryId), ne(records.id, recordId)))
    .orderBy(desc(records.publishedAt)).limit(limit) as RecordCardRow[]
  if (same.length >= limit) return same
  const more = await db.select(cardFields).from(records)
    .where(and(isNotNull(records.publishedAt), ne(records.id, recordId), notInArray(records.id, same.length ? same.map((r) => r.id) : [recordId])))
    .orderBy(desc(records.publishedAt)).limit(limit - same.length) as RecordCardRow[]
  return [...same, ...more]
}

/** Headline numbers for the home page. */
export async function getRegistryStats() {
  if (!db) return { records: 0, firstYear: null as number | null }
  const rows = await db.select({
    records: count(),
    firstYear: sql<number | null>`extract(year from min(${records.publishedAt}) filter (where ${records.publishedAt} > '2000-01-01'))::int`,
  }).from(records).where(isNotNull(records.publishedAt))
  const r = rows[0]
  return { records: Number(r?.records ?? 0), firstYear: r?.firstYear ?? null }
}

/** All published slugs (for the sitemap). */
export async function getPublishedSlugs() {
  if (!db) return []
  return db.select({ slug: records.slug, publishedAt: records.publishedAt }).from(records)
    .where(isNotNull(records.publishedAt)).orderBy(desc(records.publishedAt))
}

export async function getRecordBySlug(slug: string) {
  if (!db) return null
  const rows = await db.select({
    id: records.id, slug: records.slug, title: records.title, description: records.description,
    bodyHtml: records.bodyHtml, holderName: records.holderName, verifiedAt: records.verifiedAt,
    achievedOn: records.achievedOn, publishedAt: records.publishedAt, imageKey, imageWidth, imageHeight,
    categoryId: records.categoryId, categoryName,
  }).from(records)
    .where(and(eq(records.slug, slug), isNotNull(records.publishedAt)))
    .limit(1)
  const rec = rows[0]
  if (!rec) return null
  const cats = await db.select({ slug: categories.slug, name: categories.name })
    .from(recordCategories).innerJoin(categories, eq(categories.id, recordCategories.categoryId))
    .where(eq(recordCategories.recordId, rec.id)).orderBy(categories.name)
  return { ...rec, categories: cats }
}

/** Categories that have at least one published record, with counts. */
export async function getCategoriesWithCounts() {
  if (!db) return []
  const n = sql<number>`count(distinct ${records.id})::int`
  return db.select({ slug: categories.slug, name: categories.name, n })
    .from(categories)
    .innerJoin(recordCategories, eq(recordCategories.categoryId, categories.id))
    .innerJoin(records, and(eq(records.id, recordCategories.recordId), isNotNull(records.publishedAt)))
    .groupBy(categories.slug, categories.name)
    .orderBy(desc(n), categories.name)
}

export async function getSubmissionQueue() {
  if (!db) return []
  return db.select({
    id: submissions.id, proposedTitle: submissions.proposedTitle, status: submissions.status,
    createdAt: submissions.createdAt, holderName: submissions.holderName, holderIsMinor: submissions.holderIsMinor,
    guardianName: submissions.guardianName, guardianRelationship: submissions.guardianRelationship,
    guardianConsentStatus: submissions.guardianConsentStatus, applicantEmail: users.email,
  }).from(submissions)
    .innerJoin(users, eq(users.id, submissions.applicantId))
    .orderBy(desc(submissions.createdAt))
    .limit(100)
}

export async function getDashboardStats() {
  if (!db) return { total: 0, pending: 0, published: 0 }
  const all = await db.select().from(submissions)
  return {
    total: all.length,
    pending: all.filter((s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW').length,
    published: all.filter((s) => s.status === 'PUBLISHED').length,
  }
}

/** Categories an applicant can pick (excludes WordPress housekeeping categories). */
export async function getCategories() {
  if (!db) return []
  return db.select({ id: categories.id, name: categories.name }).from(categories)
    .where(notInArray(categories.slug, ['uncategorized', 'featured']))
    .orderBy(categories.name)
}

export async function getPage(slug: string) {
  if (!db) return null
  const rows = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1)
  return rows[0] ?? null
}

/** A submission, only if it belongs to the given applicant (ownership enforced in the query). */
export async function getOwnSubmission(id: string, applicantId: string) {
  if (!db) return null
  const rows = await db.select({
    id: submissions.id, proposedTitle: submissions.proposedTitle, status: submissions.status,
    createdAt: submissions.createdAt, reviewNotes: submissions.reviewNotes, category: categories.name,
    holderName: submissions.holderName, holderIsMinor: submissions.holderIsMinor,
    guardianConsentStatus: submissions.guardianConsentStatus,
  }).from(submissions)
    .innerJoin(categories, eq(categories.id, submissions.categoryId))
    .where(and(eq(submissions.id, id), eq(submissions.applicantId, applicantId)))
    .limit(1)
  return rows[0] ?? null
}
