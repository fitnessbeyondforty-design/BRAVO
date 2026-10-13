'use client'
import Link from 'next/link'
import { useActionState } from 'react'
import type { AuthState } from '@/server/actions/auth'

type Props = {
  mode: 'sign-in' | 'sign-up'
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>
  next: string
  initialError?: string
  notice?: string
}

const input = 'field'

export function AuthForm({ mode, action, next, initialError, notice }: Props) {
  const [state, formAction, pending] = useActionState(action, initialError ? { error: initialError } : undefined)
  const isSignUp = mode === 'sign-up'
  const q = next !== '/' ? `?next=${encodeURIComponent(next)}` : ''

  return (
    <div className="w-full max-w-md animate-rise-in">
      <p className="eyebrow text-gold-700">{isSignUp ? 'Join the registry' : 'Welcome back'}</p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-teal-700">{isSignUp ? 'Create account' : 'Sign in'}</h1>
      <p className="mt-3 text-ink-muted">
        {isSignUp ? 'Apply for records and track your submissions.' : 'Welcome back to Bravo World Records.'}
      </p>

      {notice && (
        <p role="status" className="mt-8 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200">
          {notice}
        </p>
      )}

      {state?.message ? (
        <p role="status" className="mt-8 rounded-xl bg-paper-100 p-5 text-sm text-teal-700 ring-1 ring-gold-400/50">
          {state.message}
        </p>
      ) : (
        <form action={formAction} className="mt-8 space-y-5" noValidate={false}>
          <input type="hidden" name="next" value={next} />
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required className={input} />
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor="password" className="label">Password</label>
              {!isSignUp && (
                <Link href="/forgot-password" className="text-xs font-medium text-gold-700 underline-offset-4 hover:underline">
                  Forgot password?
                </Link>
              )}
            </div>
            <input id="password" name="password" type="password" required minLength={8}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              aria-describedby={isSignUp ? 'pw-hint' : undefined} className={input} />
            {isSignUp && <p id="pw-hint" className="mt-1.5 text-xs text-ink-muted">At least 8 characters.</p>}
          </div>
          {state?.error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">{state.error}</p>}
          <button type="submit" disabled={pending}
            className="btn-gold w-full">
            {pending ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-ink-muted">
        {isSignUp ? 'Already have an account? ' : 'New here? '}
        <Link href={`${isSignUp ? '/sign-in' : '/sign-up'}${q}`} className="font-semibold text-gold-700 underline-offset-4 hover:underline">
          {isSignUp ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </div>
  )
}
