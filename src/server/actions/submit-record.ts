'use server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/server/db'
import { submissions, auditLogs } from '@/server/db/schema'
import { getSessionUser } from '@/server/auth/supabase'
import { ratelimit } from '@/server/rate-limit'
import { SubmissionInput } from '@/server/validation/submission'
import { GUARDIAN_CONSENT_VERSION } from '@/lib/consent'

export type SubmitResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> }

export async function submitRecord(raw: unknown): Promise<SubmitResult> {
  // 1. Authn — identity comes from the session, never the client payload.
  const user = await getSessionUser()
  if (!user) redirect('/sign-in?next=/apply')

  // 2. Rate-limit (brute-force / spam guard).
  const ip = (await headers()).get('x-forwarded-for') ?? 'anon'
  const { success } = await ratelimit.limit(`submit:${user.id}:${ip}`)
  if (!success) return { ok: false, error: 'Too many attempts. Try again shortly.' }

  // 3. Validate.
  const parsed = SubmissionInput.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: 'Please fix the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  }

  if (!db) return { ok: false, error: 'Database is not configured yet.' }

  // 4. Insert via the server connection (the REST API is read-only on submissions).
  //    applicant_id comes from the session; DB check constraints enforce the guardian rules.
  const d = parsed.data
  const minor = d.holderIsMinor === 'yes'
  const [row] = await db.insert(submissions).values({
    applicantId: user.id,
    categoryId: d.categoryId,
    proposedTitle: d.proposedTitle,
    claimDetails: d.claimDetails,
    holderName: d.holderName,
    holderIsMinor: minor,
    ...(minor ? {
      guardianName: d.guardianName!,
      guardianRelationship: d.guardianRelationship!,
      guardianConsentAt: new Date(),
      guardianConsentVersion: GUARDIAN_CONSENT_VERSION,
      guardianConsentStatus: 'PENDING_VERIFICATION' as const,
    } : {}),
    status: 'SUBMITTED',
  }).returning({ id: submissions.id })

  await db.insert(auditLogs).values({
    actorId: user.id, action: 'SUBMISSION_CREATED', entityType: 'submission', entityId: row.id,
    metadata: minor ? { guardianConsent: { version: GUARDIAN_CONSENT_VERSION, relationship: d.guardianRelationship } } : null,
  })

  redirect(`/apply/status/${row.id}`)
}
