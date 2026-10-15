/**
 * Submission evidence uploads (MASTER-BRIEF §8.3). Single source of truth for the accepted
 * evidence file types and size cap — shared by the client picker (MediaUploader), the server
 * action that mints the signed upload URL (server/actions/upload.ts), and the record-media bucket
 * config. The bucket ALSO enforces these limits server-side (storage.buckets.allowed_mime_types /
 * file_size_limit — see supabase/policies.sql), which is the hard guarantee: the browser uploads
 * straight to Storage with a signed token, so the Node layer never sees the bytes.
 */

export const UPLOAD_BUCKET = 'record-media'

/** 15 MiB — matches the record-media bucket's file_size_limit. */
export const MAX_FILE_BYTES = 15 * 1024 * 1024

/** Mirrors submissions.mediaKeys (max 10) in server/validation/submission.ts. */
export const MAX_FILES = 10

type Accepted = { mime: string; ext: string; kind: 'IMAGE' | 'DOCUMENT' }

/** Accepted evidence types. Keep in lock-step with the bucket's allowed_mime_types. (Video deferred
 *  to a later, paid-plan iteration — see the brief — because free-tier Storage is ~1 GB total.) */
const ACCEPTED: readonly Accepted[] = [
  { mime: 'image/jpeg', ext: 'jpg', kind: 'IMAGE' },
  { mime: 'image/png', ext: 'png', kind: 'IMAGE' },
  { mime: 'image/webp', ext: 'webp', kind: 'IMAGE' },
  { mime: 'image/gif', ext: 'gif', kind: 'IMAGE' },
  { mime: 'image/avif', ext: 'avif', kind: 'IMAGE' },
  { mime: 'application/pdf', ext: 'pdf', kind: 'DOCUMENT' },
]

export const ACCEPTED_MIME: readonly string[] = ACCEPTED.map((a) => a.mime)

/** `accept` attribute for the <input type="file">. */
export const ACCEPT_ATTR = ACCEPTED_MIME.join(',')

export function isAcceptedMime(mime: string): boolean {
  return ACCEPTED_MIME.includes(mime)
}

/** Canonical file extension for an accepted MIME type. We never trust the client's filename/extension. */
export function extForMime(mime: string): string | null {
  return ACCEPTED.find((a) => a.mime === mime)?.ext ?? null
}

/** media.type enum value for a storage key, inferred from its (server-chosen) extension. */
export function mediaTypeForKey(key: string): 'IMAGE' | 'VIDEO' | 'DOCUMENT' {
  const ext = key.split('.').pop()?.toLowerCase() ?? ''
  return ACCEPTED.find((a) => a.ext === ext)?.kind ?? 'DOCUMENT'
}

/** True when a storage key points at an image (for choosing a thumbnail vs a document chip). */
export function isImageKey(key: string): boolean {
  const ext = key.split('.').pop()?.toLowerCase() ?? ''
  return ACCEPTED.some((a) => a.ext === ext && a.kind === 'IMAGE')
}

/** Human-readable size, e.g. "15 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  const mb = bytes / (1024 * 1024)
  return `${mb % 1 === 0 ? mb.toFixed(0) : mb.toFixed(1)} MB`
}
