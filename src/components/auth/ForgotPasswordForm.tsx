'use client'
import Link from 'next/link'
import { useActionState } from 'react'
import { requestPasswordReset, type AuthState } from '@/server/actions/auth'

const input = 'field'

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(requestPasswordReset, undefined)

  return (
    <div className="w-full max-w-md animate-rise-in">
      <p className="eyebrow text-gold-700">Account recovery</p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-teal-700">Forgot your password?</h1>
      <p className="mt-3 text-ink-muted">Enter your email and we’ll send a link to set a new one.</p>

      {state?.message ? (
        <p role="status" className="mt-8 rounded-xl bg-paper-100 p-5 text-sm text-teal-700 ring-1 ring-gold-400/50">
          {state.message}
        </p>
      ) : (
        <form action={formAction} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required className={input} />
          </div>
          {state?.error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">{state.error}</p>}
          <button type="submit" disabled={pending} className="btn-gold w-full">
            {pending ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-ink-muted">
        Remembered it?{' '}
        <Link href="/sign-in" className="font-semibold text-gold-700 underline-offset-4 hover:underline">Back to sign in</Link>
      </p>
    </div>
  )
}
