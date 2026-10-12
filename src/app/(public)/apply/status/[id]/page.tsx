import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getSessionUser } from '@/server/auth/supabase'
import { getOwnSubmission } from '@/server/db/queries'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Submission status', robots: { index: false } }

const LABEL: Record<string, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Submitted — awaiting review', UNDER_REVIEW: 'Under review',
  NEEDS_CHANGES: 'Changes requested', APPROVED: 'Approved', REJECTED: 'Not approved', PUBLISHED: 'Published',
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function StatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) redirect(`/sign-in?next=/apply/status/${encodeURIComponent(id)}`)
  if (!UUID.test(id)) notFound()
  // Ownership is part of the WHERE clause — someone else's id is indistinguishable from a missing one.
  const sub = await getOwnSubmission(id, user.id)
  if (!sub) notFound()

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <p className="eyebrow text-gold-700">{sub.category}</p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-teal-700">{sub.proposedTitle}</h1>
      <dl className="mt-8 grid gap-4 rounded-3xl bg-white p-8 shadow-plate ring-1 ring-paper-200 sm:grid-cols-2">
        <div><dt className="eyebrow text-ink-muted">Status</dt><dd className="mt-1 text-teal-700">{LABEL[sub.status] ?? sub.status}</dd></div>
        <div><dt className="eyebrow text-ink-muted">Submitted</dt>
          <dd className="mt-1 text-teal-700">{sub.createdAt.toLocaleDateString('en-IN', { dateStyle: 'medium' })}</dd></div>
        <div><dt className="eyebrow text-ink-muted">Record holder</dt><dd className="mt-1 text-teal-700">{sub.holderName}</dd></div>
        {sub.holderIsMinor && (
          <div><dt className="eyebrow text-ink-muted">Guardian consent</dt>
            <dd className="mt-1 text-teal-700">
              {sub.guardianConsentStatus === 'VERIFIED' ? 'Verified' : 'Received — we will contact you to verify'}
            </dd></div>
        )}
        <div className="sm:col-span-2"><dt className="eyebrow text-ink-muted">Reference</dt>
          <dd className="mt-1 font-mono text-sm text-ink-soft">{sub.id}</dd></div>
        {sub.reviewNotes && (
          <div className="sm:col-span-2"><dt className="eyebrow text-ink-muted">Reviewer notes</dt>
            <dd className="mt-1 whitespace-pre-line text-teal-700">{sub.reviewNotes}</dd></div>
        )}
      </dl>
      <p className="mt-8"><Link href="/records" className="btn-ghost">Browse published records</Link></p>
    </main>
  )
}
