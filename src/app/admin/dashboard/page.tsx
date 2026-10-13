import { getDashboardStats } from '@/server/db/queries'

export const dynamic = 'force-dynamic'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-plate ring-1 ring-paper-200">
      <p className="eyebrow text-ink-muted">{label}</p>
      <p className="mt-3 font-serif text-4xl text-teal-700">{value}</p>
    </div>
  )
}

export default async function DashboardPage() {
  const s = await getDashboardStats()
  return (
    <div>
      <h1 className="font-serif text-3xl text-teal-700">Overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Total submissions" value={s.total} />
        <Stat label="Pending review" value={s.pending} />
        <Stat label="Published submissions" value={s.published} />
      </div>
      <p className="mt-4 text-sm text-ink-muted">
        These count applicant submissions. To manage the migrated registry and publish drafts, see{' '}
        <a href="/admin/records" className="text-gold-700 underline hover:text-gold-600">Records</a>.
      </p>
    </div>
  )
}
