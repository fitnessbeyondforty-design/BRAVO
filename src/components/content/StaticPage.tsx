import { notFound } from 'next/navigation'
import { getPage } from '@/server/db/queries'
import { sanitizeRichHtml } from '@/lib/sanitize'
import { PageMasthead } from '@/components/layout/PageMasthead'

const EYEBROW: Record<string, string> = { about: 'The organisation', contact: 'Get in touch', terms: 'Rules & terms' }

/** Renders a CMS page from `public.pages` (content migrated from WordPress). */
export async function StaticPage({ slug }: { slug: string }) {
  const page = await getPage(slug)
  if (!page) notFound()
  return (
    <main>
      <PageMasthead eyebrow={EYEBROW[slug] ?? 'Bravo World Records'} title={page.title} />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
        <div data-reveal className="record-prose prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-medium prose-headings:text-teal-700
          prose-p:text-ink-soft prose-li:text-ink-soft prose-a:text-gold-700 prose-a:underline-offset-4 prose-strong:text-teal-700 prose-li:marker:text-gold-500"
          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(page.bodyHtml) }} />
      </div>
    </main>
  )
}
