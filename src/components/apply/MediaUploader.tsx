'use client'
import { useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { createSubmissionUploadUrl } from '@/server/actions/upload'
import { UPLOAD_BUCKET, ACCEPT_ATTR, MAX_FILE_BYTES, MAX_FILES, formatBytes, isAcceptedMime } from '@/lib/upload'

type Item = {
  localId: string
  name: string
  size: number
  isImage: boolean
  previewUrl: string | null
  status: 'uploading' | 'done' | 'error'
  key: string | null
  error?: string
}

// One browser Supabase client for the tab. It carries no session — the signed-upload token is the
// only authorization the PUT needs — so it is safe to share.
let browserClient: ReturnType<typeof createBrowserClient> | null = null
function getBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    )
  }
  return browserClient
}

/**
 * Evidence picker for the apply form (MASTER-BRIEF §8.3). Each selected file is sent straight to
 * Supabase Storage via a server-minted signed upload URL; the resulting object keys are reported up
 * to the form, which submits them as `mediaKeys`. `onBusyChange` lets the form block submit while
 * an upload is still in flight.
 */
export function MediaUploader({
  onKeysChange,
  onBusyChange,
}: {
  onKeysChange: (keys: string[]) => void
  onBusyChange: (busy: boolean) => void
}) {
  const [items, setItems] = useState<Item[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Report keys + busy state up whenever items change.
  useEffect(() => {
    onKeysChange(items.filter((i) => i.status === 'done' && i.key).map((i) => i.key as string))
    onBusyChange(items.some((i) => i.status === 'uploading'))
  }, [items, onKeysChange, onBusyChange])

  // Revoke any object URLs on unmount.
  useEffect(() => () => { items.forEach((i) => i.previewUrl && URL.revokeObjectURL(i.previewUrl)) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (localId: string, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it) => (it.localId === localId ? { ...it, ...patch } : it)))

  async function uploadOne(file: File, localId: string) {
    const ticket = await createSubmissionUploadUrl({ contentType: file.type, size: file.size })
    if (!ticket.ok) {
      update(localId, { status: 'error', error: ticket.error })
      return
    }
    const { error } = await getBrowserClient()
      .storage.from(UPLOAD_BUCKET)
      .uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type })
    if (error) {
      update(localId, { status: 'error', error: 'Upload failed — please try again.' })
      return
    }
    update(localId, { status: 'done', key: ticket.key })
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (inputRef.current) inputRef.current.value = '' // let the same file be re-picked after a remove
    if (files.length === 0) return

    const room = Math.max(0, MAX_FILES - items.length)
    const toAdd = files.slice(0, room)
    const newItems: Item[] = toAdd.map((file) => {
      const localId = crypto.randomUUID()
      const isImage = file.type.startsWith('image/')
      const previewUrl = isImage ? URL.createObjectURL(file) : null
      const common = { localId, name: file.name, size: file.size, isImage, previewUrl, key: null as string | null }
      if (!isAcceptedMime(file.type)) return { ...common, status: 'error', error: 'Unsupported file type.' }
      if (!(file.size > 0 && file.size <= MAX_FILE_BYTES)) return { ...common, status: 'error', error: `Must be ${formatBytes(MAX_FILE_BYTES)} or smaller.` }
      return { ...common, status: 'uploading' }
    })

    setItems((prev) => [...prev, ...newItems])
    newItems.forEach((it, i) => { if (it.status === 'uploading') void uploadOne(toAdd[i], it.localId) })
  }

  function remove(localId: string) {
    setItems((prev) => {
      const target = prev.find((i) => i.localId === localId)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((i) => i.localId !== localId)
    })
  }

  const full = items.length >= MAX_FILES

  return (
    <div>
      <span className="label">Evidence (optional)</span>
      <p className="mt-1 text-xs text-ink-muted">
        Photos or a PDF that back up your claim — up to {MAX_FILES} files, {formatBytes(MAX_FILE_BYTES)} each.
        JPG, PNG, WebP, GIF, AVIF or PDF. You can also send more during review.
      </p>

      <input
        ref={inputRef}
        id="evidence"
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        onChange={onPick}
        disabled={full}
        className="sr-only"
      />
      <label
        htmlFor="evidence"
        className={`mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-paper-300 bg-paper-50 px-4 py-5 text-sm font-medium text-ink-soft transition hover:border-gold-500 hover:text-gold-700 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold-500 ${full ? 'pointer-events-none opacity-50' : ''}`}
      >
        <span aria-hidden="true" className="text-lg leading-none text-gold-600">＋</span>
        {full ? `Maximum of ${MAX_FILES} files` : 'Choose files to upload'}
      </label>

      {items.length > 0 && (
        <ul aria-live="polite" className="mt-3 space-y-2">
          {items.map((it) => (
            <li key={it.localId} className="flex items-center gap-3 rounded-xl bg-paper-50 p-2.5 ring-1 ring-paper-200">
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-md bg-paper-200 ring-1 ring-paper-300">
                {it.isImage && it.previewUrl
                  ? <img src={it.previewUrl} alt="" className="h-full w-full object-cover" />
                  : <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-ink-muted">PDF</span>}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-teal-700">{it.name}</span>
                <span className="block text-xs text-ink-muted">
                  {it.status === 'uploading' && <span className="text-gold-700">Uploading…</span>}
                  {it.status === 'done' && <span className="text-emerald-700">Uploaded ✓</span>}
                  {it.status === 'error' && <span className="text-red-700">{it.error}</span>}
                  <span className="ml-2">{formatBytes(it.size)}</span>
                </span>
              </span>
              <button
                type="button"
                onClick={() => remove(it.localId)}
                aria-label={`Remove ${it.name}`}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-red-700 ring-1 ring-paper-300 hover:ring-red-400"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
