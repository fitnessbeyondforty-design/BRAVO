import { Seal } from '@/components/brand/Seal'

/** Split layout for sign-in / sign-up: brand panel + form. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-[calc(100vh-6.5rem)] lg:grid-cols-2">
      <section className="relative isolate hidden overflow-hidden bg-teal-700 p-16 text-paper-50 lg:flex lg:flex-col lg:justify-between" aria-hidden="true">
        <div className="absolute inset-0 -z-10 bg-guilloche" />
        <p className="eyebrow text-gold-300">Bravo International Book of World Records</p>
        <div>
          <Seal className="h-56 w-56" spin />
          <p className="mt-10 max-w-md font-serif text-4xl font-medium leading-tight">
            Every record begins with a single <em className="text-foil">application.</em>
          </p>
          <p className="mt-4 max-w-md text-teal-100">Create an account to submit your claim, upload evidence and follow its review.</p>
        </div>
        <p className="text-xs text-teal-200">Verified · Certified · Preserved</p>
      </section>
      <section className="flex items-center justify-center bg-paper-50 px-4 py-16 sm:px-6">{children}</section>
    </main>
  )
}
