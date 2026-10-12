import Link from 'next/link'
import { Seal } from '@/components/brand/Seal'

const COLS = [
  { title: 'Explore', links: [
    { href: '/records', label: 'All records' },
    { href: '/#categories', label: 'Categories' },
    { href: '/#latest', label: 'Latest recognitions' },
  ] },
  { title: 'Records', links: [
    { href: '/apply', label: 'Apply for a record' },
    { href: '/#process', label: 'How certification works' },
    { href: '/terms', label: 'Rules & terms' },
  ] },
  { title: 'Organisation', links: [
    { href: '/about', label: 'About Bravo' },
    { href: '/contact', label: 'Contact' },
  ] },
]

export function SiteFooter() {
  const link = 'text-teal-100/80 transition hover:text-gold-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-300'
  return (
    <footer className="relative overflow-hidden bg-teal-800 text-teal-100">
      <div className="pointer-events-none absolute inset-0 bg-guilloche opacity-70" aria-hidden="true" />
      <Seal className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] opacity-[0.07]" spin />
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <div className="flex items-center gap-4">
              <Seal className="h-16 w-16" />
              <p className="font-display text-2xl font-bold tracking-[0.2em] text-gold-300">BRAVO</p>
            </div>
            <p className="mt-6 max-w-sm font-serif text-lg italic leading-relaxed text-teal-100/90">
              Documenting extraordinary human achievement — verified, certified and preserved for the record.
            </p>
            <Link href="/apply" className="btn-gold mt-8">Apply for a record</Link>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {COLS.map((c) => (
              <nav key={c.title} aria-label={c.title}>
                <p className="eyebrow text-gold-400">{c.title}</p>
                <ul className="mt-5 space-y-3 text-sm">
                  {c.links.map((l) => <li key={l.href}><Link href={l.href} className={link}>{l.label}</Link></li>)}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-3 border-t border-teal-100/10 pt-8 text-xs text-teal-200 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Bravo International Book of World Records. All rights reserved.</p>
          <a href="mailto:initiative@bravoworldrecords.com" className={link}>initiative@bravoworldrecords.com</a>
        </div>
      </div>
    </footer>
  )
}
