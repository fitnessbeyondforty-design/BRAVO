import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/AuthForm'
import { AuthShell } from '@/components/auth/AuthShell'
import { signUp } from '@/server/actions/auth'
import { getSessionUser } from '@/server/auth/supabase'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Create account', robots: { index: false } }

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = '/' } = await searchParams
  const safe = next.startsWith('/') && !next.startsWith('//') ? next : '/'
  if (await getSessionUser()) redirect(safe)
  return (
    <AuthShell>
      <AuthForm mode="sign-up" action={signUp} next={safe} />
    </AuthShell>
  )
}
