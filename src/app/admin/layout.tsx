import Link from 'next/link'
import { requireStaff } from '@/server/auth/roles'
import { signOut } from '@/server/actions/auth'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false } }

// Role gate: only MODERATOR / SUPER_ADMIN get past this. Fails closed.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await requireStaff()
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-paper-200 pb-4">
        <span className="font-serif text-2xl text-teal-700">Bravo Admin</span>
        <nav aria-label="Admin" className="flex flex-wrap items-center gap-4 text-sm text-ink-soft">
          <Link href="/admin/dashboard" className="hover:text-gold-700">Dashboard</Link>
          <Link href="/admin/submissions" className="hover:text-gold-700">Submissions</Link>
          <Link href="/admin/records" className="hover:text-gold-700">Records</Link>
          <Link href="/admin/homepage" className="hover:text-gold-700">Homepage</Link>
          <span className="text-ink-muted" title={user.email}>{role?.replace('_', ' ').toLowerCase()}</span>
          <form action={signOut}>
            <button type="submit" className="rounded-md px-2 py-1 ring-1 ring-paper-300 hover:text-gold-700">Sign out</button>
          </form>
        </nav>
      </header>
      {children}
    </div>
  )
}
