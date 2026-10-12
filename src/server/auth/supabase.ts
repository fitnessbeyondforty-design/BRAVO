import { cookies } from 'next/headers'
import { createServerClient as createSSRClient } from '@supabase/ssr'

// Server-side Supabase client bound to the request's cookies.
export async function createServerClient() {
  const cookieStore = await cookies()
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (all) => {
          try {
            all.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // called from a Server Component — safe to ignore; middleware refreshes
          }
        },
      },
    },
  )
}

export async function getSessionUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
