'use server'
import { revalidatePath } from 'next/cache'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/server/db'
import { records, auditLogs } from '@/server/db/schema'
import { getStaffOrNull } from '@/server/auth/roles'

const Input = z.object({ id: z.string().uuid() })

type Result = { ok: true; slug: string } | { ok: false; error: string }

/**
 * Publish a draft record (MASTER-BRIEF §2b item 2 / §7 0c).
 * Sets published_at to the existing verification date (falling back to now()), then repoints the
 * record's legacy WordPress URL from the holding page (/records) to its now-live page. Idempotent:
 * only a row that is still a draft is published, so a double click can't republish or re-date it.
 */
export async function publishRecord(raw: { id: string }): Promise<Result> {
  // Server actions are public POST endpoints — re-check the role here, never trust the UI.
  const staff = await getStaffOrNull()
  if (!staff) return { ok: false, error: 'Not authorized.' }
  const parsed = Input.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Invalid request.' }
  if (!db) return { ok: false, error: 'Database is not configured yet.' }
  const { id } = parsed.data

  const published = await db.update(records)
    .set({ publishedAt: sql`coalesce(${records.verifiedAt}, now())` })
    .where(and(eq(records.id, id), isNull(records.publishedAt)))
    .returning({ slug: records.slug })

  if (published.length === 0) {
    const [existing] = await db.select({ slug: records.slug }).from(records).where(eq(records.id, id)).limit(1)
    return existing
      ? { ok: false, error: 'This record is already published.' }
      : { ok: false, error: 'Record not found.' }
  }

  const { slug } = published[0]

  // Point the old WordPress URL at the live record instead of the /records holding page.
  await db.execute(sql`
    update public.legacy_redirects
    set new_path = ${'/records/' + slug}, status = 301
    where old_path = ${'/' + slug + '/'} and new_path = '/records'
  `)

  await db.insert(auditLogs).values({
    actorId: staff.user.id, action: 'RECORD_PUBLISH', entityType: 'record', entityId: id,
    metadata: { slug },
  })

  revalidatePath('/admin/records')
  revalidatePath('/records')
  revalidatePath(`/records/${slug}`)
  revalidatePath('/')
  return { ok: true, slug }
}
