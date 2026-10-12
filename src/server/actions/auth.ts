'use server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createServerClient } from '@/server/auth/supabase'
import { ratelimit } from '@/server/rate-limit'

export type AuthState = { error?: string; message?: string } | undefined

const Credentials = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(72),
})

/** Only allow same-site relative return paths (blocks open redirects like //evil.com). */
function safeNext(raw: FormDataEntryValue | null): string {
  const v = typeof raw === 'string' ? raw : ''
  return v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : '/'
}

async function siteOrigin() {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'bravo-world-records.vercel.app'
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

async function limited(kind: string, email: string) {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon'
  const { success } = await ratelimit.limit(`${kind}:${email}:${ip}`)
  return !success
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = Credentials.safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  if (await limited('signin', parsed.data.email)) return { error: 'Too many attempts. Try again in a few minutes.' }

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  // Deliberately generic: don't reveal whether the email exists.
  if (error) {
    if (error.code === 'email_not_confirmed') return { error: 'Confirm your email first — check your inbox for the link.' }
    return { error: 'Incorrect email or password.' }
  }
  redirect(safeNext(formData.get('next')))
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = Credentials.safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  if (await limited('signup', parsed.data.email)) return { error: 'Too many attempts. Try again in a few minutes.' }

  const next = safeNext(formData.get('next'))
  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}` },
  })
  if (error) {
    if (error.code === 'weak_password') return { error: 'That password is too weak or has appeared in a data breach. Choose another.' }
    if (error.status === 429) return { error: 'Too many sign-ups right now. Try again later.' }
    return { error: 'Could not create the account. Try again.' }
  }
  // Email confirmation on → no session yet.
  if (!data.session) return { message: 'Check your email for a confirmation link to finish creating your account.' }
  redirect(next)
}

export async function signOut() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/')
}
