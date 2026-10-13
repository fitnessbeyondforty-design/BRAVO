'use client'
import { useActionState } from 'react'
import { updatePassword, type AuthState } from '@/server/actions/auth'

const input = 'field'

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(updatePassword, undefined)

  return (
    <div className="w-full max-w-md animate-rise-in">
      <p className="eyebrow text-gold-700">Account recovery</p>
      <h1 className="mt-3 font-serif text-4xl font-medium text-teal-700">Set a new password</h1>
      <p className="mt-3 text-ink-muted">Choose a new password for your account.</p>

      <form action={formAction} className="mt-8 space-y-5">
        <div>
          <label htmlFor="password" className="label">New password</label>
          <input id="password" name="password" type="password" required minLength={8}
            autoComplete="new-password" aria-describedby="pw-hint" className={input} />
          <p id="pw-hint" className="mt-1.5 text-xs text-ink-muted">At least 8 characters.</p>
        </div>
        <div>
          <label htmlFor="confirm" className="label">Confirm new password</label>
          <input id="confirm" name="confirm" type="password" required minLength={8}
            autoComplete="new-password" className={input} />
        </div>
        {state?.error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn-gold w-full">
          {pending ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
