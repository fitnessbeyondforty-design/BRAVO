import { getDraftRecords, getRecordCounts } from '@/server/db/queries'
import { DraftsTable, type DraftRow } from '@/components/admin/DraftsTable'

export const dynamic = 'force-dynamic'

export default async function AdminRecordsPage() {
  const [drafts, counts] = await Promise.all([getDraftRecords(), getRecordCounts()])
  const rows: DraftRow[] = drafts.map((d) => ({
    id: d.id,
    slug: d.slug,
    title: d.title,
    holderName: d.holderName,
    categoryName: d.categoryName,
  }))
  return (
    <div>
      <h1 className="mb-2 font-serif text-3xl text-teal-700">Draft records</h1>
      <p className="mb-6 max-w-2xl text-sm text-ink-muted">
        {counts.published} published · {counts.drafts} awaiting publication. Publishing a draft makes it live at its public URL and 301-redirects its old WordPress link to the new page.
      </p>
      <DraftsTable rows={rows} />
    </div>
  )
}
