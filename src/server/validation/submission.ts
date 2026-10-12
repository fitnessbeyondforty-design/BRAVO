import { z } from 'zod'

export const SubmissionInput = z.object({
  categoryId: z.string().uuid('Pick a valid category.'),
  proposedTitle: z.string().trim().min(8, 'Title is too short.').max(160),
  claimDetails: z.string().trim().min(50, 'Describe the claim in more detail.').max(5000),
  holderName: z.string().trim().min(2, 'Enter the record holder’s full name.').max(120),
  holderIsMinor: z.enum(['yes', 'no'], { errorMap: () => ({ message: 'Tell us whether the record holder is under 18.' }) }),
  guardianName: z.string().trim().max(120).optional(),
  guardianRelationship: z.enum(['PARENT', 'LEGAL_GUARDIAN']).optional(),
  guardianConsent: z.boolean().optional(),
  mediaKeys: z.array(z.string().max(512)).max(10).default([]),
}).superRefine((v, ctx) => {
  if (v.holderIsMinor !== 'yes') return
  if (!v.guardianName || v.guardianName.length < 2)
    ctx.addIssue({ code: 'custom', path: ['guardianName'], message: 'Enter the parent or guardian’s full name.' })
  if (!v.guardianRelationship)
    ctx.addIssue({ code: 'custom', path: ['guardianRelationship'], message: 'Choose your relationship to the record holder.' })
  if (v.guardianConsent !== true)
    ctx.addIssue({ code: 'custom', path: ['guardianConsent'], message: 'A parent or legal guardian must give consent for a record holder under 18.' })
})
export type SubmissionInput = z.infer<typeof SubmissionInput>
