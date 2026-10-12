import Link from 'next/link'
import { getViewer, STAFF_ROLES } from '@/server/auth/roles'
import { signOut } from '@/server/actions/auth'
import { Seal } from '@/components/brand/Seal'
import { MobileMenu } from './MobileMenu'

const NAV = [
  { href: '/records', label: 'Records' },
  { href: '/#categories', label: 'Categories' },
  { href: '/#process', label: 'How it works' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export async function SiteHeader() {
  const viewer = await getViewer().catch(() => null)
  const isStaff = !!viewer?.role && STAFF_ROLES.includes(viewer.role)
  const link = 'relative py-2 text-[0.8rem] font-medium uppercase tracking-[0.14em] text-ink-soft transition hover:text-gold-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-500 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-gold-500 after:transition-transform after:duration-300 hover:after:scale-x-100'

  const account = viewer ? (
    <form action={signOut}>
      <button type="submit" className={link}>Sign out</button>
    </form>
  ) : (
    <Link href="/sign-in" className={link}>Sign in</Link>
  )

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-gold-400 focus:px-4 focus:py-2 focus:text-teal-900">
        Skip to content
      </a>
      {/* Utility strip */}
      <div className="bg-teal-800 text-[0.7rem] text-teal-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
          <p className="eyebrow truncate !text-[0.58rem] !tracking-[0.2em] text-gold-300 sm:!text-[0.62rem] sm:!tracking-[0.3em]">Official registry of verified human achievement</p>
          <div className="hidden items-center gap-5 sm:flex">
            {isStaff && <Link href="/admin/dashboard" className="hover:text-gold-300">Admin</Link>}
            <a href="mailto:initiative@bravoworldrecords.com" className="hover:text-gold-300">initiative@bravoworldrecords.com</a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-paper-200/80 bg-paper-50/85 backdrop-blur-xl supports-[backdrop-filter]:bg-paper-50/70">
        <div className="relative mx-auto flex h-[var(--header-h)] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-500" aria-label="Bravo International Book of World Records — home">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-teal-700 shadow-plate transition duration-700 group-hover:rotate-[20deg]">
              <Seal className="h-10 w-10" legend="BRAVO • WORLD RECORDS • BRAVO • WORLD RECORDS • " />
            </span>
            <span className="leading-none">
              <span className="block font-display text-xl font-bold tracking-[0.18em] text-teal-700">BRAVO</span>
              <span className="mt-1 block whitespace-nowrap font-display text-[0.5rem] font-semibold tracking-[0.1em] text-gold-700 sm:text-[0.55rem] sm:tracking-[0.24em]">International Book of World Records</span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
            {NAV.map((n) => <Link key={n.href} href={n.href} className={link}>{n.label}</Link>)}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden lg:block">{account}</div>
            <Link href="/apply" className="btn-gold hidden !px-5 !py-2.5 sm:inline-flex">Apply for a record</Link>
            <MobileMenu>
              <nav aria-label="Mobile" className="flex flex-col divide-y divide-paper-200">
                {NAV.map((n) => (
                  <Link key={n.href} href={n.href} className="py-3.5 font-serif text-xl text-teal-700 hover:text-gold-700">{n.label}</Link>
                ))}
                {isStaff && <Link href="/admin/dashboard" className="py-3.5 font-serif text-xl text-teal-700">Admin</Link>}
                <div className="flex items-center justify-between gap-4 pt-4">
                  {account}
                  <Link href="/apply" className="btn-gold">Apply for a record</Link>
                </div>
              </nav>
            </MobileMenu>
          </div>
        </div>
      </header>
    </>
  )
}
