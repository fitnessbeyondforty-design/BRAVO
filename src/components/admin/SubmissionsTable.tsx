'use client'
import { useState, useTransition } from 'react'
import { reviewSubmission } from '@/server/actions/review-submission'

export type SubmissionRow = {
  id: string
  proposedTitle: string
  holderName: string
  applicant: string
  status: string
  createdAt: string
  minor: null | { guardianName: string; relationship: string; consent: 'PENDING_VERIFICATION' | 'VERIFIED' }
}

type Action = 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'VERIFY_GUARDIAN'

const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: 'bg-gold-50 text-gold-800 ring-gold-300',
  UNDER_REVIEW: 'bg-teal-50 text-teal-700 ring-teal-200',
  NEEDS_CHANGES: 'bg-amber-50 text-amber-800 ring-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  REJECTED: 'bg-red-50 text-red-800 ring-red-200',
  PUBLISHED: 'bg-teal-700 text-gold-200 ring-teal-700',
}
const pill = 'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset'

export function SubmissionsTable({ rows }: { rows: SubmissionRow[] }) {
  const [pending, start] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const act = (id: string, action: Action) =>
    start(async () => {
      setError(null)
      setBusyId(id)
      const res = await reviewSubmission({ id, action })
      if (!res.ok) setError(res.error)
      setBusyId(null)
    })

  return (
    <div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">{error}</p>}
      <div className="overflow-x-auto rounded-2xl bg-white shadow-plate ring-1 ring-paper-200">
        <table className="min-w-full divide-y divide-paper-200 text-sm">
          <caption className="sr-only">Pending record submissions</caption>
          <thead className="bg-paper-100">
            <tr className="text-left eyebrow text-ink-muted">
              <th scope="col" className="px-4 py-3">Proposed record</th>
              <th scope="col" className="px-4 py-3 hidden sm:table-cell">Applicant</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-200 text-ink-soft">
            {rows.map((r) => {
              const busy = pending && busyId === r.id
              const needsVerify = r.minor?.consent === 'PENDING_VERIFICATION'
              return (
                <tr key={r.id} className="align-top hover:bg-paper-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-teal-700">{r.proposedTitle}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">Holder: {r.holderName}</p>
                    {r.minor && (
                      <p className="mt-1.5 text-xs text-ink-soft">
                        <span className={`${pill} mr-1.5 ${needsVerify ? 'bg-amber-50 text-amber-800 ring-amber-200' : 'bg-emerald-50 text-emerald-800 ring-emerald-200'}`}>
                          Under 18 · {needsVerify ? 'consent unverified' : 'consent verified'}
                        </span>
                        {r.minor.relationship}: {r.minor.guardianName}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell break-all">{r.applicant}</td>
                  <td className="px-4 py-3">
                    <span className={`${pill} ${STATUS_STYLES[r.status] ?? ''}`}>{r.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {needsVerify && (
                        <button onClick={() => act(r.id, 'VERIFY_GUARDIAN')} disabled={busy}
                          title="Confirm you have checked that the applicant is this child's parent or legal guardian"
                          className="rounded-full bg-gold-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gold-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300">
                          Verify guardian
                        </button>
                      )}
                      <button onClick={() => act(r.id, 'APPROVE')} disabled={busy || needsVerify}
                        title={needsVerify ? 'Verify the guardian first' : undefined}
                        className="rounded-full bg-teal-700 px-3 py-1.5 text-xs font-semibold text-paper-50 hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300">
                        Approve
                      </button>
                      <button onClick={() => act(r.id, 'REQUEST_CHANGES')} disabled={busy}
                        className="rounded-full ring-1 ring-paper-300 px-3 py-1.5 text-xs font-medium text-ink-soft hover:ring-gold-500">
                        Changes
                      </button>
                      <button onClick={() => act(r.id, 'REJECT')} disabled={busy}
                        className="rounded-full ring-1 ring-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50">
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="px-4 py-10 text-center text-ink-muted">No submissions in queue.</p>}
      </div>
    </div>
  )
}
