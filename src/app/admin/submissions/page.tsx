import { getSubmissionQueue } from '@/server/db/queries'
import { SubmissionsTable, type SubmissionRow } from '@/components/admin/SubmissionsTable'
import { RELATIONSHIP_LABEL } from '@/lib/consent'

export const dynamic = 'force-dynamic'

export default async function SubmissionsPage() {
  const rows = await getSubmissionQueue()
  const mapped: SubmissionRow[] = rows.map((r) => ({
    id: r.id,
    proposedTitle: r.proposedTitle,
    holderName: r.holderName,
    applicant: r.applicantEmail,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    minor: r.holderIsMinor && r.guardianRelationship && r.guardianConsentStatus !== 'NOT_REQUIRED'
      ? { guardianName: r.guardianName ?? '', relationship: RELATIONSHIP_LABEL[r.guardianRelationship], consent: r.guardianConsentStatus }
      : null,
  }))
  return (
    <div>
      <h1 className="mb-2 font-serif text-3xl text-teal-700">Submission queue</h1>
      <p className="mb-6 max-w-2xl text-sm text-ink-muted">
        Claims for record holders under 18 cannot be approved until you verify, by contacting the applicant, that they are the child’s parent or legal guardian.
      </p>
      <SubmissionsTable rows={mapped} />
    </div>
  )
}
