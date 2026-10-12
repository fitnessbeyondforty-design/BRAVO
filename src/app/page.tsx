import Link from 'next/link'
import Image from 'next/image'
import { getCategoriesWithCounts, getFeaturedRecords, getPublishedRecords, getRegistryStats } from '@/server/db/queries'
import { RecordCard } from '@/components/records/RecordCard'
import { Seal } from '@/components/brand/Seal'
import { CountUp } from '@/components/motion/CountUp'
import { Certificate } from '@/components/brand/Certificate'
import { mediaUrl } from '@/lib/media'
import { formatDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

// WordPress housekeeping categories that make poor browse entry points.
const HIDE = new Set(['uncategorized', 'achievers', 'featured'])

const STEPS = [
  { t: 'Apply', d: 'Create an account and submit your claim — what you achieved, when, where, and who witnessed it.' },
  { t: 'Review', d: 'Our adjudication team examines the claim against the record rules and asks for anything missing.' },
  { t: 'Verify', d: 'Evidence — video, photographs, witness statements and documents — is checked before any decision.' },
  { t: 'Certify', d: 'Approved achievements are certified and published in the Bravo registry for the world to see.' },
]

export default async function HomePage() {
  const [featured, cats, stats, latest] = await Promise.all([
    getFeaturedRecords(7),
    getCategoriesWithCounts(),
    getRegistryStats(),
    getPublishedRecords({ limit: 16 }),
  ])
  const topCats = cats.filter((c) => !HIDE.has(c.slug))
  const [lead, ...rest] = featured
  const collage = latest.rows.filter((r) => r.imageKey).slice(0, 3)
  const ticker = latest.rows

  return (
    <main>
      {/* ───────────── Hero ───────────── */}
      <section className="relative isolate overflow-hidden bg-teal-700 text-paper-50">
        <div className="absolute inset-0 -z-10 bg-guilloche" aria-hidden="true" />
        <div className="absolute -left-40 top-1/3 -z-10 h-[36rem] w-[36rem] rounded-full bg-gold-400/10 blur-3xl animate-glow" aria-hidden="true" />
        <svg className="absolute inset-0 -z-10 h-full w-full opacity-40" preserveAspectRatio="none" viewBox="0 0 1200 700" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M-50 ${520 - i * 60} C 300 ${380 - i * 50}, 700 ${660 - i * 40}, 1250 ${420 - i * 60}`}
              fill="none" stroke="#C89854" strokeOpacity={0.35 - i * 0.06} strokeWidth="1"
              strokeDasharray="1600" strokeDashoffset="1600" className="animate-draw" style={{ animationDelay: `${i * 250}ms` }} />
          ))}
        </svg>

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-36 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[1.15fr_1fr] lg:pb-44">
          <div>
            <p className="eyebrow animate-rise-in text-gold-300">Bravo International Book of World Records</p>
            <h1 className="mt-6 animate-rise-in font-serif text-[2.6rem] font-medium leading-[1.05] tracking-tight [animation-delay:120ms] sm:text-6xl lg:text-7xl">
              Where the extraordinary becomes <em className="text-foil animate-shimmer font-semibold">official.</em>
            </h1>
            <p className="mt-6 max-w-xl animate-rise-in text-lg leading-relaxed text-teal-100 [animation-delay:240ms]">
              The registry of verified human achievement — in the arts, academics, sport, social work and extraordinary skill.
              Every record examined, certified and preserved.
            </p>

            <form action="/records" method="get" role="search" className="mt-10 flex max-w-xl animate-rise-in items-center gap-2 rounded-full bg-paper-50 p-1.5 pl-6 shadow-lift ring-1 ring-gold-300/30 [animation-delay:360ms]">
              <label htmlFor="hero-q" className="sr-only">Search records</label>
              <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-gold-600" aria-hidden="true"><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <input id="hero-q" name="q" type="search" placeholder="Search a record or record holder…" autoComplete="off"
                className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-0" />
              <button type="submit" className="btn-ink !px-5">Search</button>
            </form>

            <div className="mt-8 flex animate-rise-in flex-wrap items-center gap-3 [animation-delay:480ms]">
              <Link href="/records" className="btn-gold">Explore the records</Link>
              <Link href="/apply" className="btn-ghost-light">Apply for a record</Link>
            </div>
          </div>

          {/* Seal + floating record plates */}
          <div className="relative mx-auto hidden aspect-square w-full max-w-[34rem] sm:block" aria-hidden="true">
            <Seal className="absolute inset-0 h-full w-full opacity-90 drop-shadow-[0_0_40px_rgba(200,152,84,.25)]" spin />
            {collage.map((r, i) => {
              const pos = ['left-[4%] top-[14%] -rotate-6', 'right-[2%] top-[6%] rotate-[5deg]', 'left-[30%] bottom-[2%] rotate-2'][i]
              return (
                <div key={r.id} className={`absolute w-[38%] ${pos} animate-rise-in`} style={{ animationDelay: `${500 + i * 180}ms` }}>
                  <div className="rounded-xl bg-paper-50 p-2 pb-3 shadow-lift transition duration-700 hover:rotate-0 hover:scale-105">
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-teal-700">
                      <Image src={mediaUrl(r.imageKey)!} alt="" fill sizes="220px" className="object-cover object-[center_20%]" />
                    </div>
                    <p className="mt-2 truncate px-1 font-display text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-gold-700">Certified record</p>
                    <p className="truncate px-1 font-serif text-xs text-teal-700">{r.holderName}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ───────────── Stats (overlaps hero) ───────────── */}
      <section aria-label="The registry in numbers" className="relative z-10 mx-auto -mt-20 max-w-5xl px-4 sm:px-6">
        <dl data-reveal className="grid grid-cols-3 divide-x divide-paper-200 rounded-3xl bg-white shadow-lift ring-1 ring-paper-200">
          {[
            { k: 'Verified records', short: 'Records', v: <CountUp value={stats.records} /> },
            { k: 'Record categories', short: 'Categories', v: <CountUp value={topCats.length} /> },
            { k: 'Recognising achievement since', short: 'Since', v: stats.firstYear ?? '—' },
          ].map((s) => (
            <div key={s.k} className="flex flex-col-reverse items-center px-2 py-6 text-center sm:px-6 sm:py-8">
              <dt className="eyebrow mt-2 !text-[0.6rem] !tracking-[0.18em] text-ink-muted sm:!text-[0.7rem] sm:!tracking-[0.28em]">
                <span className="sm:hidden">{s.short}</span><span className="hidden sm:inline">{s.k}</span>
              </dt>
              <dd className="font-serif text-3xl font-medium text-teal-700 sm:text-5xl">{s.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ───────────── Ticker ───────────── */}
      {ticker.length > 0 && (
        <section aria-label="Latest recognitions" className="marquee mt-20 overflow-hidden border-y border-paper-200 bg-paper-100 py-5">
          <div className="marquee-track flex w-max animate-marquee gap-12 whitespace-nowrap motion-reduce:animate-none">
            {[...ticker, ...ticker].map((r, i) => (
              <Link key={`${r.id}-${i}`} href={`/records/${r.slug}`} tabIndex={i >= ticker.length ? -1 : undefined}
                aria-hidden={i >= ticker.length ? true : undefined}
                className="group flex items-center gap-3 text-sm text-ink-soft hover:text-gold-700">
                <span className="text-gold-500" aria-hidden="true">✦</span>
                <span className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 group-hover:text-gold-700">{r.holderName}</span>
                <span className="max-w-[22rem] truncate font-serif italic">{r.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ───────────── Latest ───────────── */}
      {lead && (
        <section id="latest" aria-labelledby="latest-h" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
          <header data-reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-gold-700">From the registry</p>
              <h2 id="latest-h" className="mt-3 font-serif text-4xl font-medium text-teal-700 sm:text-5xl">The latest entries in the Book</h2>
            </div>
            <Link href="/records" className="btn-ghost">View all records <span aria-hidden="true">→</span></Link>
          </header>

          {/* Lead story */}
          <article data-reveal className="group relative mt-14 grid overflow-hidden rounded-3xl bg-teal-700 text-paper-50 shadow-lift lg:grid-cols-2">
            <div className="zoom-img relative min-h-[22rem] overflow-hidden lg:min-h-[32rem]">
              {lead.imageKey ? (
                <Image src={mediaUrl(lead.imageKey)!} alt="" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover object-[center_20%]" />
              ) : <div className="absolute inset-0 bg-guilloche" />}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-teal-700/30" aria-hidden="true" />
            </div>
            <div className="relative flex flex-col justify-center p-8 sm:p-12 lg:p-16">
              <Seal className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 opacity-10" />
              <p className="eyebrow text-gold-300">{lead.categoryName ?? 'World Record'}</p>
              <h3 className="mt-5 font-serif text-3xl font-medium leading-tight sm:text-4xl">
                <Link href={`/records/${lead.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-gold-300">
                  {lead.title}
                </Link>
              </h3>
              <p className="mt-5 line-clamp-4 leading-relaxed text-teal-100">{lead.description}</p>
              <div className="mt-8 flex items-center gap-4 border-t border-paper-50/10 pt-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-teal-200">Record holder</p>
                  <p className="mt-1 font-serif text-lg text-gold-200">{lead.holderName}</p>
                </div>
                {formatDate(lead.publishedAt) && (
                  <div className="ml-auto text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-teal-200">Recognised</p>
                    <p className="mt-1 text-sm text-paper-50">{formatDate(lead.publishedAt)}</p>
                  </div>
                )}
              </div>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-gold-300 transition group-hover:gap-3">Read the record <span aria-hidden="true">→</span></span>
            </div>
          </article>

          <div className="mt-16 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((r, i) => (
              <RecordCard key={r.id} index={i} slug={r.slug} title={r.title} holderName={r.holderName} description={r.description}
                imageKey={r.imageKey} categoryName={r.categoryName} publishedAt={r.publishedAt} />
            ))}
          </div>
        </section>
      )}

      {/* ───────────── Categories ───────────── */}
      {topCats.length > 0 && (
        <section id="categories" aria-labelledby="cat-h" className="relative border-y border-paper-200 bg-paper-100 bg-paper-grain">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
            <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
              <header data-reveal className="lg:sticky lg:top-32 lg:self-start">
                <p className="eyebrow text-gold-700">Browse by discipline</p>
                <h2 id="cat-h" className="mt-3 font-serif text-4xl font-medium text-teal-700 sm:text-5xl">Record categories</h2>
                <p className="mt-5 max-w-sm leading-relaxed text-ink-muted">
                  From feats of memory and endurance to art, literature and service to society — explore achievements by field.
                </p>
                <Link href="/records" className="btn-ink mt-8">All {topCats.length} categories</Link>
              </header>
              <ol className="grid gap-px overflow-hidden rounded-3xl bg-paper-200 ring-1 ring-paper-200 sm:grid-cols-2">
                {topCats.slice(0, 10).map((c, i) => (
                  <li key={c.slug} data-reveal style={{ ['--d' as string]: `${(i % 2) * 80}ms` }}>
                    <Link href={`/records?category=${c.slug}`}
                      className="group flex h-full items-center gap-5 bg-paper-50 p-6 transition duration-500 hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold-500 sm:p-8">
                      <span className="font-display text-3xl font-semibold text-gold-500/70 transition group-hover:text-gold-300" aria-hidden="true">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1">
                        <span className="block font-serif text-xl text-teal-700 transition group-hover:text-paper-50">{c.name}</span>
                        <span className="mt-1 block text-sm text-ink-muted transition group-hover:text-teal-100">{c.n} record{c.n === 1 ? '' : 's'}</span>
                      </span>
                      <span className="text-gold-600 transition duration-500 group-hover:translate-x-1 group-hover:text-gold-300" aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* ───────────── Process ───────────── */}
      <section id="process" aria-labelledby="process-h" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
        <header data-reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-gold-700">The path to certification</p>
          <h2 id="process-h" className="mt-3 font-serif text-4xl font-medium text-teal-700 sm:text-5xl">How a record is made official</h2>
          <div className="rule-ornament mx-auto mt-8 max-w-xs" aria-hidden="true"><span>◆</span></div>
        </header>
        <div className="relative mt-16">
        <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent md:block" aria-hidden="true" />
        <ol className="relative grid gap-10 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.t} data-reveal style={{ ['--d' as string]: `${i * 120}ms` }} className="relative text-center">
              <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-paper-50 font-display text-xl font-bold text-gold-600 ring-1 ring-gold-400/60 shadow-plate">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-6 font-serif text-2xl text-teal-700">{s.t}</h3>
              <p className="mx-auto mt-3 max-w-[16rem] text-sm leading-relaxed text-ink-muted">{s.d}</p>
            </li>
          ))}
        </ol>
        </div>
      </section>

      {/* ───────────── CTA ───────────── */}
      <section aria-labelledby="cta-h" className="relative isolate overflow-hidden bg-teal-700 text-paper-50">
        <div className="absolute inset-0 -z-10 bg-guilloche" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:py-32">
          <div data-reveal>
            <p className="eyebrow text-gold-300">Your achievement, on the record</p>
            <h2 id="cta-h" className="mt-4 font-serif text-4xl font-medium leading-tight sm:text-5xl">
              Has your achievement <em className="text-foil">made history?</em>
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-teal-100">
              Submit your claim to the Bravo adjudication team. Verified achievements are certified and published in the registry.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/apply" className="btn-gold">Start your application</Link>
              <Link href="/terms" className="btn-ghost-light">Read the rules</Link>
            </div>
          </div>
          <div data-reveal="scale" className="mx-auto w-full max-w-lg [perspective:1400px]">
            <Certificate />
          </div>
        </div>
      </section>
    </main>
  )
}
