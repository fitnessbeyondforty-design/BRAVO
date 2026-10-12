'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/** Disclosure menu for small screens; closes itself on navigation and on Escape. */
export function MobileMenu({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null)
  const pathname = usePathname()
  useEffect(() => { if (ref.current) ref.current.open = false }, [pathname])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && ref.current?.open) ref.current.open = false }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <details ref={ref} className="group lg:hidden">
      <summary
        className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full ring-1 ring-inset ring-teal-700/15 hover:ring-gold-500 [&::-webkit-details-marker]:hidden"
        aria-label="Menu">
        <span className="relative block h-3 w-5" aria-hidden="true">
          <span className="absolute left-0 top-0 h-px w-5 bg-teal-700 transition group-open:top-1.5 group-open:rotate-45" />
          <span className="absolute left-0 top-1.5 h-px w-5 bg-teal-700 transition group-open:opacity-0" />
          <span className="absolute left-0 top-3 h-px w-5 bg-teal-700 transition group-open:top-1.5 group-open:-rotate-45" />
        </span>
      </summary>
      <div className="absolute inset-x-0 top-full border-b border-paper-200 bg-paper-50 px-4 pb-6 pt-2 shadow-lift animate-in fade-in slide-in-from-top-2">
        {children}
      </div>
    </details>
  )
}
