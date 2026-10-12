'use server'
import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/server/db'
import { submissions, auditLogs } from '@/server/db/schema'
import { getStaffOrNull } from '@/server/auth/roles'

type ReviewAction = 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'VERIFY_GUARDIAN'
const NEXT_STATUS: Record<Exclude<ReviewAction, 'VERIFY_GUARDIAN'>, 'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES'> = {
  APPROVE: 'APPROVED', REJECT: 'REJECTED', REQUEST_CHANGES: 'NEEDS_CHANGES',
}
const Input = z.object({
  id: z.string().uuid(),
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES', 'VERIFY_GUARDIAN']),
  notes: z.string().trim().max(2000).optional(),
})

type Result = { ok: true } | { ok: false; error: string }

export async function reviewSubmission(raw: { id: string; action: ReviewAction; notes?: string }): Promise<Result> {
  // Server actions are public POST endpoints — re-check the role here, never trust the UI.
  const staff = await getStaffOrNull()
  if (!staff) return { ok: false, error: 'Not authorized.' }
  const parsed = Input.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Invalid request.' }
  if (!db) return { ok: false, error: 'Database is not configured yet.' }
  const input = parsed.data

  const [sub] = await db.select({
    holderIsMinor: submissions.holderIsMinor, guardianConsentStatus: submissions.guardianConsentStatus,
  }).from(submissions).where(eq(submissions.id, input.id)).limit(1)
  if (!sub) return { ok: false, error: 'Submission not found.' }

  if (input.action === 'VERIFY_GUARDIAN') {
    // Staff confirm, out of band, that the applicant is the child's parent/guardian (DPDP Rules r.10).
    const done = await db.update(submissions)
      .set({ guardianConsentStatus: 'VERIFIED', guardianVerifiedBy: staff.user.id, guardianVerifiedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(submissions.id, input.id), eq(submissions.guardianConsentStatus, 'PENDING_VERIFICATION')))
      .returning({ id: submissions.id })
    if (done.length === 0) return { ok: false, error: 'This submission has no guardian consent awaiting verification.' }
  } else {
    // Also enforced by the sub_minor_needs_verified_consent check constraint.
    if (input.action === 'APPROVE' && sub.holderIsMinor && sub.guardianConsentStatus !== 'VERIFIED')
      return { ok: false, error: 'Verify the parent/guardian’s consent before approving a claim for a record holder under 18.' }
    await db.update(submissions)
      .set({ status: NEXT_STATUS[input.action], reviewerId: staff.user.id, reviewNotes: input.notes, updatedAt: new Date() })
      .where(eq(submissions.id, input.id))
  }

  await db.insert(auditLogs).values({
    actorId: staff.user.id, action: `SUBMISSION_${input.action}`, entityType: 'submission', entityId: input.id,
  })

  revalidatePath('/admin/submissions')
  return { ok: true }
}
