import { redirect } from 'next/navigation'
import { getSessionUser } from '@/server/auth/supabase'
import { getCategories } from '@/server/db/queries'
import { ApplyForm } from '@/components/apply/ApplyForm'
import { PageMasthead } from '@/components/layout/PageMasthead'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Apply for a World Record' }

const NOTES = [
  { t: 'Be specific', d: 'State exactly what was achieved, the measurement, date and place.' },
  { t: 'Name your witnesses', d: 'Independent witnesses and officials strengthen a claim.' },
  { t: 'Keep your evidence', d: 'Video, photographs and documents will be requested during review.' },
  { t: 'Applying for a child?', d: 'For a record holder under 18, a parent or legal guardian must apply from their own account and give consent. We never publish a child’s date of birth or parents’ names.' },
]

export default async function ApplyPage() {
  if (!(await getSessionUser())) redirect('/sign-in?next=/apply')
  const categories = await getCategories()
  return (
    <main>
      <PageMasthead eyebrow="Record application" title="Apply for a World Record"
        lead="Submit your claim to the Bravo adjudication team. A review fee applies after submission." />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_20rem] lg:py-20">
        <div className="rounded-3xl bg-white p-6 shadow-plate ring-1 ring-paper-200 sm:p-10">
          <h2 className="font-serif text-2xl text-teal-700">Your claim</h2>
          <ApplyForm categories={categories} />
        </div>
        <aside className="space-y-6">
          <p className="eyebrow text-gold-700">Before you submit</p>
          {NOTES.map((n, i) => (
            <div key={n.t} className="flex gap-4">
              <span className="font-display text-2xl font-semibold text-gold-500">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <p className="font-serif text-lg text-teal-700">{n.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{n.d}</p>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </main>
  )
}
