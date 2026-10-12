import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createServerClient } from '@/server/auth/supabase'

// Email-confirmation / magic-link landing. Handles both the PKCE `code` flow
// (default for @supabase/ssr) and the `token_hash` flow (custom email templates).
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const rawNext = url.searchParams.get('next') ?? '/'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null

  const supabase = await createServerClient()
  let ok = false
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error
  }

  return NextResponse.redirect(new URL(ok ? next : '/sign-in?error=confirm', url.origin))
}
