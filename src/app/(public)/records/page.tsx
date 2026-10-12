import type { Metadata } from 'next'
import Link from 'next/link'
import { getCategoriesWithCounts, getPublishedRecords, PAGE_SIZE } from '@/server/db/queries'
import { RecordCard } from '@/components/records/RecordCard'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type SP = Promise<{ category?: string; page?: string; q?: string }>
const HIDE = new Set(['uncategorized', 'featured'])

function parse(sp: { category?: string; page?: string; q?: string }) {
  const category = sp.category && /^[a-z0-9-]{1,80}$/.test(sp.category) ? sp.category : undefined
  const page = Math.max(1, Math.min(1000, Number.parseInt(sp.page ?? '1', 10) || 1))
  const q = (sp.q ?? '').replace(/\s+/g, ' ').trim().slice(0, 80) || undefined
  return { category, page, q }
}

function href(category: string | undefined, page: number, q?: string) {
  const p = new URLSearchParams()
  if (q) p.set('q', q)
  if (category) p.set('category', category)
  if (page > 1) p.set('page', String(page))
  const s = p.toString()
  return s ? `/records?${s}` : '/records'
}

/** Compact page list: 1 … 4 5 [6] 7 8 … 19 */
function pageList(cur: number, total: number): (number | '…')[] {
  const set = new Set([1, total, cur - 1, cur, cur + 1].filter((n) => n >= 1 && n <= total))
  const sorted = [...set].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((n, i) => { if (i && n - sorted[i - 1] > 1) out.push('…'); out.push(n) })
  return out
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { category, page, q } = parse(await searchParams)
  const cats = category ? await getCategoriesWithCounts() : []
  const name = cats.find((c) => c.slug === category)?.name
  return {
    title: q ? `Search: ${q}` : name ? `${name} Records` : 'All Records',
    alternates: { canonical: href(category, page) },
    ...(q ? { robots: { index: false } } : {}),
  }
}

export default async function RecordsPage({ searchParams }: { searchParams: SP }) {
  const { category, page, q } = parse(await searchParams)
  const [{ rows, total }, allCats] = await Promise.all([
    getPublishedRecords({ categorySlug: category, q, offset: (page - 1) * PAGE_SIZE }),
    getCategoriesWithCounts(),
  ])
  const cats = allCats.filter((c) => !HIDE.has(c.slug))
  const current = allCats.find((c) => c.slug === category)
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const heading = current ? current.name : 'The Registry'

  const catLink = (active: boolean) => cn(
    'group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-500',
    active ? 'bg-teal-700 text-paper-50' : 'text-ink-soft hover:bg-paper-100 hover:text-teal-700',
  )
  const CatList = (
    <ul className="space-y-0.5">
      <li>
        <Link href={href(undefined, 1, q)} aria-current={!category ? 'page' : undefined} className={catLink(!category)}>
          <span>All records</span>
        </Link>
      </li>
      {cats.map((c) => (
        <li key={c.slug}>
          <Link href={href(c.slug, 1, q)} aria-current={c.slug === category ? 'page' : undefined} className={catLink(c.slug === category)}>
            <span className="truncate">{c.name}</span>
            <span className={cn('text-xs tabular-nums', c.slug === category ? 'text-gold-300' : 'text-ink-muted')}>{c.n}</span>
          </Link>
        </li>
      ))}
    </ul>
  )

  return (
    <main>
      {/* Masthead */}
      <section className="relative overflow-hidden border-b border-paper-200 bg-paper-100 bg-paper-grain">
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 sm:pt-20">
          <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-[0.2em] text-ink-muted">
            <Link href="/" className="hover:text-gold-700">Home</Link>
            <span className="mx-2 text-gold-500" aria-hidden="true">/</span>
            {current ? <Link href="/records" className="hover:text-gold-700">Records</Link> : <span aria-current="page">Records</span>}
            {current && <><span className="mx-2 text-gold-500" aria-hidden="true">/</span><span aria-current="page">{current.name}</span></>}
          </nav>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-8">
            <div className="animate-rise-in">
              <p className="eyebrow text-gold-700">{current ? 'Category' : 'Bravo International Book of World Records'}</p>
              <h1 className="mt-3 font-serif text-4xl font-medium text-teal-700 sm:text-6xl">{heading}</h1>
              <p className="mt-4 text-ink-muted">
                <span className="font-semibold text-teal-700">{total.toLocaleString('en-IN')}</span> verified record{total === 1 ? '' : 's'}
                {q && <> matching “<span className="text-teal-700">{q}</span>”</>}
                {current && <> in {current.name}</>}
              </p>
            </div>
            <form action="/records" method="get" role="search" className="flex w-full max-w-md items-center gap-2 rounded-full bg-white p-1.5 pl-5 shadow-plate ring-1 ring-paper-200">
              {category && <input type="hidden" name="category" value={category} />}
              <label htmlFor="records-q" className="sr-only">Search records</label>
              <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-gold-600" aria-hidden="true"><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <input id="records-q" name="q" type="search" defaultValue={q} placeholder="Record title or holder name…"
                className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-0" />
              <button type="submit" className="btn-ink !px-5 !py-2.5">Search</button>
            </form>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[16rem_1fr] lg:py-16">
        {/* Filters */}
        <aside aria-label="Categories">
          <details className="group rounded-2xl bg-white p-4 ring-1 ring-paper-200 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-teal-700 [&::-webkit-details-marker]:hidden">
              <span>Category: <span className="text-gold-700">{current?.name ?? 'All records'}</span></span>
              <span className="transition group-open:rotate-180" aria-hidden="true">▾</span>
            </summary>
            <div className="mt-3 max-h-80 overflow-y-auto">{CatList}</div>
          </details>
          <div className="sticky top-28 hidden max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 lg:block">
            <p className="eyebrow mb-4 px-3 text-gold-700">Categories</p>
            {CatList}
          </div>
        </aside>

        <section aria-label="Records">
          {q && (
            <p className="mb-8 text-sm">
              <Link href={href(category, 1)} className="inline-flex items-center gap-2 rounded-full bg-paper-100 px-4 py-1.5 text-ink-soft ring-1 ring-paper-200 hover:ring-gold-500">
                Clear search “{q}” <span aria-hidden="true">×</span>
              </Link>
            </p>
          )}
          {rows.length === 0 ? (
            <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-paper-200">
              <p className="font-serif text-2xl text-teal-700">No records found</p>
              <p className="mt-2 text-ink-muted">Try a different name or browse all categories.</p>
              <Link href="/records" className="btn-ink mt-6">Browse all records</Link>
            </div>
          ) : (
            <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((r, i) => (
                <RecordCard key={r.id} index={i} slug={r.slug} title={r.title} holderName={r.holderName} description={r.description}
                  imageKey={r.imageKey} categoryName={r.categoryName} publishedAt={r.publishedAt} headingLevel="h2" />
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-16 flex flex-wrap items-center justify-center gap-2 border-t border-paper-200 pt-10 text-sm">
              {page > 1 && <Link rel="prev" href={href(category, page - 1, q)} className="btn-ghost !px-4 !py-2">← Previous</Link>}
              {pageList(page, pages).map((n, i) => n === '…'
                ? <span key={`e${i}`} className="px-2 text-ink-muted" aria-hidden="true">…</span>
                : <Link key={n} href={href(category, n, q)} aria-current={n === page ? 'page' : undefined} aria-label={`Page ${n}`}
                    className={cn('grid h-10 w-10 place-items-center rounded-full tabular-nums transition',
                      n === page ? 'bg-teal-700 text-paper-50' : 'text-ink-soft hover:bg-paper-100 hover:text-teal-700')}>{n}</Link>)}
              {page < pages && <Link rel="next" href={href(category, page + 1, q)} className="btn-ghost !px-4 !py-2">Next →</Link>}
            </nav>
          )}
        </section>
      </div>
    </main>
  )
}
