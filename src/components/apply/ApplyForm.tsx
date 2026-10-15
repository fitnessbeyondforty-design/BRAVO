'use client'
import { useState, useTransition } from 'react'
import { submitRecord } from '@/server/actions/submit-record'
import { GUARDIAN_CONSENT_TEXT } from '@/lib/consent'
import { MediaUploader } from '@/components/apply/MediaUploader'

const field = 'field'

export function ApplyForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({})
  const [minor, setMinor] = useState<'yes' | 'no' | ''>('')
  const [mediaKeys, setMediaKeys] = useState<string[]>([])
  const [uploadBusy, setUploadBusy] = useState(false)

  function onSubmit(formData: FormData) {
    setError(null)
    setFieldErrors({})
    const isMinor = String(formData.get('holderIsMinor') ?? '')
    start(async () => {
      const res = await submitRecord({
        categoryId: String(formData.get('categoryId') ?? ''),
        proposedTitle: String(formData.get('proposedTitle') ?? ''),
        claimDetails: String(formData.get('claimDetails') ?? ''),
        holderName: String(formData.get('holderName') ?? ''),
        holderIsMinor: isMinor,
        ...(isMinor === 'yes' ? {
          guardianName: String(formData.get('guardianName') ?? ''),
          guardianRelationship: String(formData.get('guardianRelationship') ?? '') || undefined,
          guardianConsent: formData.get('guardianConsent') === 'on',
        } : {}),
        mediaKeys,
      })
      if (res && !res.ok) {
        setError(res.error)
        setFieldErrors(res.fieldErrors ?? {})
      }
    })
  }

  const err = (k: string) =>
    fieldErrors[k]?.[0] ? <p id={`${k}-err`} className="mt-1.5 text-sm text-red-700">{fieldErrors[k]![0]}</p> : null
  const describedBy = (k: string, hint?: string) =>
    [hint, fieldErrors[k] ? `${k}-err` : undefined].filter(Boolean).join(' ') || undefined

  return (
    <form action={onSubmit} className="mt-6 space-y-6">
      <div>
        <label htmlFor="holderName" className="label">Record holder’s full name</label>
        <input id="holderName" name="holderName" required minLength={2} maxLength={120} autoComplete="off" className={field}
          aria-invalid={!!fieldErrors.holderName} aria-describedby={describedBy('holderName', 'holderName-hint')} />
        <p id="holderName-hint" className="mt-1.5 text-xs text-ink-muted">The person (or group) the record will be certified to — you, or someone you are applying for.</p>
        {err('holderName')}
      </div>

      <fieldset aria-describedby={describedBy('holderIsMinor')}>
        <legend className="label">Is the record holder under 18 today?</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {(['no', 'yes'] as const).map((v) => (
            <label key={v}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-paper-50 px-4 py-2 text-sm text-ink-soft ring-1 ring-paper-300 has-[:checked]:bg-teal-700 has-[:checked]:text-paper-50 has-[:checked]:ring-teal-700 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-500">
              <input type="radio" name="holderIsMinor" value={v} required className="sr-only"
                checked={minor === v} onChange={() => setMinor(v)} />
              {v === 'yes' ? 'Yes, under 18' : 'No, 18 or older'}
            </label>
          ))}
        </div>
        {err('holderIsMinor')}
      </fieldset>

      {minor === 'yes' && (
        <fieldset className="space-y-5 rounded-2xl bg-paper-100 p-5 ring-1 ring-paper-300 sm:p-6">
          <legend className="sr-only">Parent or guardian consent</legend>
          <div>
            <p className="font-serif text-lg text-teal-700">Parent or guardian consent</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              Indian data-protection law requires a parent or legal guardian’s consent before we process a child’s details.
              <strong className="font-semibold text-teal-700"> This application must be sent by the parent or legal guardian from their own account.</strong>{' '}
              If you are under 18 yourself, please ask your parent or guardian to apply for you.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="guardianName" className="label">Your full name (parent / guardian)</label>
              <input id="guardianName" name="guardianName" required minLength={2} maxLength={120} autoComplete="name" className={field}
                aria-invalid={!!fieldErrors.guardianName} aria-describedby={describedBy('guardianName')} />
              {err('guardianName')}
            </div>
            <div>
              <label htmlFor="guardianRelationship" className="label">Your relationship to the record holder</label>
              <select id="guardianRelationship" name="guardianRelationship" required defaultValue="" className={field}
                aria-invalid={!!fieldErrors.guardianRelationship} aria-describedby={describedBy('guardianRelationship')}>
                <option value="" disabled>Choose…</option>
                <option value="PARENT">Parent</option>
                <option value="LEGAL_GUARDIAN">Legal guardian</option>
              </select>
              {err('guardianRelationship')}
            </div>
          </div>
          <div>
            <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
              <input type="checkbox" name="guardianConsent" required
                className="mt-1 h-4 w-4 shrink-0 rounded border-paper-300 text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
                aria-invalid={!!fieldErrors.guardianConsent} aria-describedby={describedBy('guardianConsent')} />
              <span>{GUARDIAN_CONSENT_TEXT}</span>
            </label>
            {err('guardianConsent')}
          </div>
          <p className="text-xs leading-relaxed text-ink-muted">
            Before review starts, our team will contact you on your account email to confirm you are the child’s parent or guardian.
          </p>
        </fieldset>
      )}

      <div>
        <label htmlFor="categoryId" className="label">Category</label>
        <select id="categoryId" name="categoryId" required defaultValue="" className={field}
          aria-invalid={!!fieldErrors.categoryId} aria-describedby={describedBy('categoryId')}>
          <option value="" disabled>Choose a category…</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {err('categoryId')}
      </div>
      <div>
        <label htmlFor="proposedTitle" className="label">Proposed record title</label>
        <input id="proposedTitle" name="proposedTitle" required minLength={8} maxLength={160} className={field}
          aria-invalid={!!fieldErrors.proposedTitle} aria-describedby={describedBy('proposedTitle')} />
        {err('proposedTitle')}
      </div>
      <div>
        <label htmlFor="claimDetails" className="label">Describe your claim</label>
        <textarea id="claimDetails" name="claimDetails" required minLength={50} maxLength={5000} rows={6} className={field}
          aria-invalid={!!fieldErrors.claimDetails} aria-describedby={describedBy('claimDetails', 'claimDetails-hint')} />
        <p id="claimDetails-hint" className="mt-1.5 text-xs text-ink-muted">What you did, when, where, and who witnessed it. At least 50 characters.</p>
        {err('claimDetails')}
      </div>

      <MediaUploader onKeysChange={setMediaKeys} onBusyChange={setUploadBusy} />
      {err('mediaKeys')}

      {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">{error}</p>}
      <button type="submit" disabled={pending || uploadBusy}
        className="btn-gold disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? 'Submitting…' : uploadBusy ? 'Finishing uploads…' : 'Submit for review'}
      </button>
    </form>
  )
}
