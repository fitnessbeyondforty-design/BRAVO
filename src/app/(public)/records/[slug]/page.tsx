import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { getRecordBySlug, getRelatedRecords } from '@/server/db/queries'
import { sanitizeRichHtml } from '@/lib/sanitize'
import { mediaUrl } from '@/lib/media'
import { formatDate } from '@/lib/format'
import { Seal } from '@/components/brand/Seal'
import { RecordCard } from '@/components/records/RecordCard'

export const dynamic = 'force-dynamic'

const load = cache((slug: string) => getRecordBySlug(slug))

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const rec = await load(slug)
  if (!rec) return { title: 'Record not found' }
  const url = `https://bravoworldrecords.com/records/${rec.slug}`
  const img = mediaUrl(rec.imageKey)
  return {
    title: rec.title,
    description: rec.description.slice(0, 155),
    alternates: { canonical: url },
    openGraph: { title: rec.title, description: rec.description.slice(0, 200), url, type: 'article', images: img ? [img] : undefined },
    twitter: { card: img ? 'summary_large_image' : 'summary', title: rec.title, description: rec.description.slice(0, 200), images: img ? [img] : undefined },
  }
}

export default async function RecordDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const rec = await load(slug)
  if (!rec) notFound()

  const [related, h] = await Promise.all([getRelatedRecords(rec.id, rec.categoryId, 3), headers()])
  const img = mediaUrl(rec.imageKey)
  const body = sanitizeRichHtml(rec.bodyHtml)
  const recognisedAt = rec.verifiedAt ?? rec.publishedAt
  const recognised = formatDate(recognisedAt)
  const filed = rec.categories.filter((c) => !['uncategorized', 'featured'].includes(c.slug))
  const primary = filed.find((c) => c.slug !== 'achievers')
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'bravoworldrecords.com'
  const shareUrl = `https://${host}/records/${rec.slug}`
  const enc = encodeURIComponent
  const share = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${enc(`${rec.title} — ${shareUrl}`)}` },
    { label: 'X', href: `https://x.com/intent/post?text=${enc(rec.title)}&url=${enc(shareUrl)}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}` },
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(shareUrl)}` },
  ]

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'CreativeWork',
    name: rec.title, description: rec.description,
    creator: { '@type': 'Person', name: rec.holderName },
    url: `https://bravoworldrecords.com/records/${rec.slug}`,
    ...(img ? { image: img } : {}),
    ...(rec.verifiedAt ? { dateCreated: rec.verifiedAt.toISOString() } : {}),
    publisher: { '@type': 'Organization', name: 'Bravo International Book of World Records' },
  }

  const meta = [
    { k: 'Record holder', v: rec.holderName },
    { k: 'Category', v: primary?.name ?? 'World Record' },
    ...(recognised ? [{ k: 'Recognised', v: recognised }] : []),
    { k: 'Status', v: 'Verified & certified' },
  ]

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      {/* ───── Plate ───── */}
      <section className="relative overflow-hidden border-b border-paper-200 bg-paper-100 bg-paper-grain">
        <Seal className="pointer-events-none absolute -right-40 -top-40 h-[36rem] w-[36rem] opacity-[0.06]" spin />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:pb-24 lg:pt-14">
          <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-[0.2em] text-ink-muted">
            <Link href="/" className="hover:text-gold-700">Home</Link>
            <span className="mx-2 text-gold-500" aria-hidden="true">/</span>
            <Link href="/records" className="hover:text-gold-700">Records</Link>
            {primary && (<><span className="mx-2 text-gold-500" aria-hidden="true">/</span>
              <Link href={`/records?category=${primary.slug}`} className="hover:text-gold-700">{primary.name}</Link></>)}
          </nav>

          <div className={img ? 'mt-10 grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16' : 'mt-10 max-w-3xl'}>
            {img && (
              <figure className="animate-rise-in">
                <div className="relative rounded-2xl bg-white p-3 shadow-lift ring-1 ring-paper-200">
                  <div className="overflow-hidden rounded-xl bg-teal-700">
                    {/* Hero is the LCP image on record pages: priority (no lazy), intrinsic dims avoid layout shift. */}
                    <Image src={img} alt={`${rec.holderName} — ${rec.title}`} priority
                      width={rec.imageWidth ?? 1000} height={rec.imageHeight ?? 1250}
                      sizes="(max-width: 1024px) 92vw, 560px"
                      className="mx-auto max-h-[38rem] w-full h-auto object-contain" />
                  </div>
                  <div className="absolute -bottom-8 -right-6 h-24 w-24 rounded-full bg-teal-700 p-1 shadow-lift sm:h-28 sm:w-28" aria-hidden="true">
                    <Seal className="h-full w-full" spin />
                  </div>
                </div>
              </figure>
            )}

            <div className="animate-rise-in [animation-delay:150ms]">
              <span className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold-200">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true"><path fill="currentColor" d="M8 0l2 2.3 3-.4.4 3L16 8l-2.3 2 .4 3-3 .4L8 16l-2-2.3-3 .4-.4-3L0 8l2.3-2-.4-3 3-.4z"/><path d="M5 8.2l2 2 4-4" fill="none" stroke="#0C2428" strokeWidth="1.6"/></svg>
                Officially verified record
              </span>
              <h1 className="mt-6 font-serif text-4xl font-medium leading-[1.1] text-teal-700 sm:text-5xl">{rec.title}</h1>
              <div className="rule-ornament my-8 max-w-xs text-[0.6rem]" aria-hidden="true"><span>◆</span></div>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-6">
                {meta.map((m) => (
                  <div key={m.k} className={m.k === 'Record holder' ? 'col-span-2' : undefined}>
                    <dt className="eyebrow text-ink-muted">{m.k}</dt>
                    <dd className={m.k === 'Record holder' ? 'mt-2 font-serif text-3xl text-gold-700' : 'mt-2 text-teal-700'}>{m.v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-10 flex flex-wrap items-center gap-2">
                <span className="mr-2 text-xs uppercase tracking-[0.2em] text-ink-muted">Share</span>
                {share.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    className="rounded-full bg-white px-4 py-2 text-xs font-medium text-teal-700 ring-1 ring-paper-200 transition hover:ring-gold-500 hover:text-gold-700">
                    {s.label}<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Citation ───── */}
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
        <p data-reveal className="eyebrow text-gold-700">The record</p>
        <div data-reveal className="record-prose prose prose-lg mt-6 max-w-none prose-headings:font-serif prose-headings:font-medium prose-headings:text-teal-700
          prose-p:text-ink-soft prose-p:leading-relaxed prose-a:text-gold-700 prose-a:underline-offset-4 prose-strong:text-teal-700
          first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-7xl first-letter:leading-[0.8] first-letter:text-gold-600">
          {body ? <div dangerouslySetInnerHTML={{ __html: body }} /> : <p>{rec.description}</p>}
        </div>

        {filed.length > 0 && (
          <div data-reveal className="mt-12 border-t border-paper-200 pt-8">
            <p className="eyebrow text-ink-muted">Filed under</p>
            <ul aria-label="Categories" className="mt-4 flex flex-wrap gap-2">
              {filed.map((c) => (
                <li key={c.slug}>
                  <Link href={`/records?category=${c.slug}`} className="rounded-full bg-paper-100 px-4 py-1.5 text-sm text-ink-soft ring-1 ring-paper-200 transition hover:text-gold-700 hover:ring-gold-500">{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <aside data-reveal className="mt-14 flex flex-col items-center gap-6 rounded-3xl bg-teal-700 p-8 text-center text-paper-50 sm:flex-row sm:text-left">
          <Seal className="h-20 w-20 shrink-0" />
          <div>
            <p className="font-serif text-xl">Entered in the Bravo International Book of World Records</p>
            <p className="mt-1 text-sm text-teal-100">Believe you can set a record of your own? Submit your claim for review.</p>
          </div>
          <Link href="/apply" className="btn-gold shrink-0 sm:ml-auto">Apply</Link>
        </aside>
      </article>

      {/* ───── Related ───── */}
      {related.length > 0 && (
        <section aria-labelledby="related-h" className="border-t border-paper-200 bg-paper-100">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <div data-reveal className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="related-h" className="font-serif text-3xl font-medium text-teal-700 sm:text-4xl">More from the registry</h2>
              <Link href={primary ? `/records?category=${primary.slug}` : '/records'} className="btn-ghost">
                {primary ? `More ${primary.name}` : 'All records'} <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r, i) => (
                <RecordCard key={r.id} index={i} slug={r.slug} title={r.title} holderName={r.holderName} description={r.description}
                  imageKey={r.imageKey} categoryName={r.categoryName} publishedAt={r.publishedAt} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
