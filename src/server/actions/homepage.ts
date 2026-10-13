'use server'
import { revalidatePath } from 'next/cache'
import { inArray, isNotNull, and } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/server/db'
import { heroSlots, homeFeatures, records, auditLogs } from '@/server/db/schema'
import { getStaffOrNull } from '@/server/auth/roles'

const Ids = z.array(z.string().uuid()).max(100)

type Result = { ok: true; count: number } | { ok: false; error: string }

/** Keep only ids that are real, published records — preserving the caller's order, dropping unknowns/dupes. */
async function validPublishedInOrder(ids: string[]): Promise<string[]> {
  const unique = [...new Set(ids)]
  if (unique.length === 0) return []
  const rows = await db!.select({ id: records.id }).from(records)
    .where(and(inArray(records.id, unique), isNotNull(records.publishedAt)))
  const ok = new Set(rows.map((r) => r.id))
  return unique.filter((id) => ok.has(id))
}

/** Replace the three hero photos (first three valid ids win). */
export async function setHeroSlots(rawIds: string[]): Promise<Result> {
  const staff = await getStaffOrNull()
  if (!staff) return { ok: false, error: 'Not authorized.' }
  const parsed = Ids.safeParse(rawIds)
  if (!parsed.success) return { ok: false, error: 'Invalid request.' }
  if (!db) return { ok: false, error: 'Database is not configured yet.' }

  const ids = (await validPublishedInOrder(parsed.data)).slice(0, 3)
  await db.transaction(async (tx) => {
    await tx.delete(heroSlots)
    if (ids.length) await tx.insert(heroSlots).values(ids.map((id, i) => ({ position: i + 1, recordId: id })))
    await tx.insert(auditLogs).values({
      actorId: staff.user.id, action: 'HERO_SLOTS_SET', entityType: 'homepage', entityId: staff.user.id,
      metadata: { recordIds: ids },
    })
  })
  revalidatePath('/')
  revalidatePath('/admin/homepage')
  return { ok: true, count: ids.length }
}

/** Replace the ordered "latest entries in the Book" list. */
export async function setHomeFeatures(rawIds: string[]): Promise<Result> {
  const staff = await getStaffOrNull()
  if (!staff) return { ok: false, error: 'Not authorized.' }
  const parsed = Ids.safeParse(rawIds)
  if (!parsed.success) return { ok: false, error: 'Invalid request.' }
  if (!db) return { ok: false, error: 'Database is not configured yet.' }

  const ids = (await validPublishedInOrder(parsed.data)).slice(0, 24)
  await db.transaction(async (tx) => {
    await tx.delete(homeFeatures)
    if (ids.length) await tx.insert(homeFeatures).values(ids.map((id, i) => ({ position: i + 1, recordId: id })))
    await tx.insert(auditLogs).values({
      actorId: staff.user.id, action: 'HOME_FEATURES_SET', entityType: 'homepage', entityId: staff.user.id,
      metadata: { recordIds: ids },
    })
  })
  revalidatePath('/')
  revalidatePath('/admin/homepage')
  return { ok: true, count: ids.length }
}
