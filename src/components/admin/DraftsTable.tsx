'use client'
import { useState, useTransition } from 'react'
import { publishRecord } from '@/server/actions/publish-record'

export type DraftRow = {
  id: string
  slug: string
  title: string
  holderName: string
  categoryName: string | null
}

const pill = 'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset'

export function DraftsTable({ rows }: { rows: DraftRow[] }) {
  const [pending, start] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<Record<string, true>>({})

  const publish = (id: string) =>
    start(async () => {
      setError(null)
      setBusyId(id)
      const res = await publishRecord({ id })
      if (res.ok) setDone((m) => ({ ...m, [id]: true }))
      else setError(res.error)
      setBusyId(null)
    })

  return (
    <div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">{error}</p>}
      <div className="overflow-x-auto rounded-2xl bg-white shadow-plate ring-1 ring-paper-200">
        <table className="min-w-full divide-y divide-paper-200 text-sm">
          <caption className="sr-only">Draft records awaiting publication</caption>
          <thead className="bg-paper-100">
            <tr className="text-left eyebrow text-ink-muted">
              <th scope="col" className="px-4 py-3">Record</th>
              <th scope="col" className="px-4 py-3 hidden sm:table-cell">Category</th>
              <th scope="col" className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-200 text-ink-soft">
            {rows.map((r) => {
              const busy = pending && busyId === r.id
              const isDone = !!done[r.id]
              return (
                <tr key={r.id} className="align-top hover:bg-paper-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-teal-700">{r.title}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">Holder: {r.holderName}</p>
                    <p className="mt-0.5 text-xs text-ink-muted break-all">/records/{r.slug}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">{r.categoryName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {isDone ? (
                        <>
                          <span className={`${pill} bg-emerald-50 text-emerald-800 ring-emerald-200`}>Published</span>
                          <a href={`/records/${r.slug}`} target="_blank" rel="noopener noreferrer"
                            className="rounded-full ring-1 ring-paper-300 px-3 py-1.5 text-xs font-medium text-ink-soft hover:ring-gold-500">
                            View
                          </a>
                        </>
                      ) : (
                        <button onClick={() => publish(r.id)} disabled={busy}
                          className="rounded-full bg-teal-700 px-3 py-1.5 text-xs font-semibold text-paper-50 hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300">
                          {busy ? 'Publishing…' : 'Publish'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="px-4 py-10 text-center text-ink-muted">No draft records. Everything verified is already live.</p>}
      </div>
    </div>
  )
}
