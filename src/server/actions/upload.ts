'use server'
import { randomUUID } from 'node:crypto'
import { headers } from 'next/headers'
import { z } from 'zod'
import { getSessionUser, createServerClient } from '@/server/auth/supabase'
import { ratelimit } from '@/server/rate-limit'
import { UPLOAD_BUCKET, MAX_FILE_BYTES, isAcceptedMime, extForMime } from '@/lib/upload'

const Input = z.object({
  contentType: z.string().min(1).max(100),
  size: z.number().int().positive().max(MAX_FILE_BYTES),
})

export type UploadTicket =
  | { ok: true; key: string; path: string; token: string }
  | { ok: false; error: string }

/**
 * Mint a one-time signed upload URL for a single evidence file (MASTER-BRIEF §8.3).
 *
 * The browser then PUTs the bytes STRAIGHT to Supabase Storage with the returned token
 * (uploadToSignedUrl) — large files never pass through the Vercel function, so the serverless
 * body-size limit is irrelevant. Security:
 *   - identity comes from the session, never the client payload;
 *   - the SERVER chooses the object key and scopes it to `submissions/<uid>/…` (the client's
 *     filename is never used, so it can't traverse paths or collide with another user's folder);
 *   - the storage RLS policy `submission_evidence_insert` enforces the same per-user scoping
 *     independently at mint time, and the bucket's allowed_mime_types / file_size_limit cap the
 *     actual upload. (Both live in supabase/policies.sql / the storage migration.)
 */
export async function createSubmissionUploadUrl(raw: { contentType: string; size: number }): Promise<UploadTicket> {
  const user = await getSessionUser()
  if (!user) return { ok: false, error: 'Please sign in to add evidence.' }

  // Rate-limit per user (spam / storage-abuse guard), same pattern as submitRecord.
  const ip = (await headers()).get('x-forwarded-for') ?? 'anon'
  const { success } = await ratelimit.limit(`upload:${user.id}:${ip}`)
  if (!success) return { ok: false, error: 'Too many uploads just now — try again shortly.' }

  const parsed = Input.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'That file can’t be uploaded.' }
  const { contentType, size } = parsed.data
  if (!isAcceptedMime(contentType)) return { ok: false, error: 'Only JPG, PNG, WebP, GIF, AVIF or PDF files are allowed.' }
  if (size > MAX_FILE_BYTES) return { ok: false, error: 'Each file must be 15 MB or smaller.' }

  const ext = extForMime(contentType)
  if (!ext) return { ok: false, error: 'Unsupported file type.' }

  const key = `submissions/${user.id}/${randomUUID()}.${ext}`
  const supabase = await createServerClient()
  const { data, error } = await supabase.storage.from(UPLOAD_BUCKET).createSignedUploadUrl(key)
  if (error || !data) {
    // Most likely cause before the storage policy/bucket migration is applied: RLS rejects the mint.
    return { ok: false, error: 'Could not start the upload. Please try again.' }
  }

  return { ok: true, key, path: data.path, token: data.token }
}
