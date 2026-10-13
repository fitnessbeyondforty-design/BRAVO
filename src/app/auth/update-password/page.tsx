import { AuthShell } from '@/components/auth/AuthShell'
import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Set a new password', robots: { index: false } }

export default function UpdatePasswordPage() {
  return (
    <AuthShell>
      <UpdatePasswordForm />
    </AuthShell>
  )
}
