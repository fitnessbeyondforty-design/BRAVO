import Link from 'next/link'
import { Seal } from '@/components/brand/Seal'

export default function NotFound() {
  return (
    <main className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-paper-100 bg-paper-grain px-4 py-24 text-center">
      <Seal className="pointer-events-none absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 opacity-[0.05]" spin />
      <div className="relative">
        <p className="eyebrow text-gold-700">Error 404</p>
        <h1 className="mt-4 font-serif text-5xl font-medium text-teal-700 sm:text-6xl">Not in the record books</h1>
        <p className="mx-auto mt-5 max-w-md text-ink-muted">The page you were looking for doesn’t exist or has moved. Try searching the registry instead.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/records" className="btn-gold">Search the records</Link>
          <Link href="/" className="btn-ghost">Back to home</Link>
        </div>
      </div>
    </main>
  )
}
