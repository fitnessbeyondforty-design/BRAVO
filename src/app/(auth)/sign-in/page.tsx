import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/AuthForm'
import { AuthShell } from '@/components/auth/AuthShell'
import { signIn } from '@/server/actions/auth'
import { getSessionUser } from '@/server/auth/supabase'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Sign in', robots: { index: false } }

const ERRORS: Record<string, string> = {
  confirm: 'That confirmation link is invalid or has expired. Sign in or request a new link.',
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = '/', error } = await searchParams
  const safe = next.startsWith('/') && !next.startsWith('//') ? next : '/'
  if (await getSessionUser()) redirect(safe)
  return (
    <AuthShell>
      <AuthForm mode="sign-in" action={signIn} next={safe} initialError={error ? ERRORS[error] : undefined} />
    </AuthShell>
  )
}
