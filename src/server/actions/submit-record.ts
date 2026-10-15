'use server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/server/db'
import { submissions, media, auditLogs } from '@/server/db/schema'
import { getSessionUser } from '@/server/auth/supabase'
import { ratelimit } from '@/server/rate-limit'
import { SubmissionInput } from '@/server/validation/submission'
import { GUARDIAN_CONSENT_VERSION } from '@/lib/consent'
import { mediaTypeForKey } from '@/lib/upload'

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

  const d = parsed.data
  const minor = d.holderIsMinor === 'yes'

  // 3b. Evidence keys were uploaded to Storage by the client via a server-minted signed URL. Trust
  //     only keys under THIS user's own folder (the upload action scopes them to submissions/<uid>/,
  //     and the storage RLS policy enforces it — this is the final guard against a tampered payload).
  const prefix = `submissions/${user.id}/`
  const mediaKeys = [...new Set(d.mediaKeys)].filter((k) => k.startsWith(prefix)).slice(0, 10)

  // 4. Insert via the server connection (the REST API is read-only on submissions + media).
  //    applicant_id comes from the session; DB check constraints enforce the guardian rules.
  const [row] = await db.transaction(async (tx) => {
    const inserted = await tx.insert(submissions).values({
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

    const sub = inserted[0]

    if (mediaKeys.length) {
      await tx.insert(media).values(mediaKeys.map((key) => ({
        type: mediaTypeForKey(key),
        storageKey: key,
        submissionId: sub.id,
      })))
    }

    await tx.insert(auditLogs).values({
      actorId: user.id, action: 'SUBMISSION_CREATED', entityType: 'submission', entityId: sub.id,
      metadata: {
        evidenceCount: mediaKeys.length,
        ...(minor ? { guardianConsent: { version: GUARDIAN_CONSENT_VERSION, relationship: d.guardianRelationship } } : {}),
      },
    })

    return inserted
  })

  redirect(`/apply/status/${row.id}`)
}
