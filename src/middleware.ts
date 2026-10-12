import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

function withSecurityHeaders<T extends Response>(res: T) {
  res.headers.set('Content-Security-Policy', CSP)
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  return res
}

// ---- Legacy WordPress URLs → public.legacy_redirects (MASTER-BRIEF §8.1b) ----
// Keys are decoded, lower-cased paths; directories end with '/', files do not.
// Only paths outside the app's own routes are looked up, so normal traffic never hits the DB here.
const APP_PREFIXES = ['/records', '/apply', '/admin', '/sign-in', '/sign-up', '/auth', '/about', '/contact', '/terms', '/api', '/_next']
const WP_PROBES = /^\/(wp-admin|wp-login\.php|wp-json|xmlrpc\.php|wp-includes|wp-cron\.php)(\/|$)/
type Hit = [number, string | null]
const memo = new Map<string, Hit | null>() // per-isolate cache; the map changes rarely

async function lookup(keys: string[]): Promise<Hit | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null
  const cacheKey = keys.join('|')
  if (memo.has(cacheKey)) return memo.get(cacheKey)!
  const list = keys.map((k) => `"${k.replace(/["\\]/g, '')}"`).join(',')
  try {
    const res = await fetch(`${url}/rest/v1/legacy_redirects?select=old_path,status,new_path&old_path=in.(${encodeURIComponent(list)})`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
    })
    if (!res.ok) return null
    const rows = (await res.json()) as { old_path: string; status: number; new_path: string | null }[]
    const row = keys.map((k) => rows.find((r) => r.old_path === k)).find(Boolean)
    const hit: Hit | null = row ? [row.status, row.new_path] : null
    if (memo.size > 5000) memo.clear()
    memo.set(cacheKey, hit)
    return hit
  } catch {
    return null // fail open: never break the site because the redirect lookup failed
  }
}

async function legacyTarget(pathname: string): Promise<Hit | null> {
  if (pathname === '/' || APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null
  let p: string
  try { p = decodeURIComponent(pathname) } catch { p = pathname }
  p = p.toLowerCase()
  if (p.length > 300) return null
  if (WP_PROBES.test(p)) return [410, null]
  if (p.startsWith('/tag/')) return [301, '/records']
  if (/^\/page\/\d+\/?$/.test(p)) return [301, '/records']
  const dir = p.endsWith('/') ? p : p + '/'
  // WordPress variants: /slug/amp/, /slug/feed/, /category/x/page/2/
  const base = dir.replace(/(amp|feed|embed|page\/\d+)\/$/, '')
  return lookup([...new Set([p, dir, base])])
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const leg = await legacyTarget(pathname)
  if (leg) {
    const [status, target] = leg
    if (status === 410 || !target) {
      return withSecurityHeaders(new NextResponse('This page no longer exists.', { status: 410, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }))
    }
    return withSecurityHeaders(NextResponse.redirect(new URL(target, request.url), 301))
  }
  // skipTrailingSlashRedirect is on, so normalise trailing slashes here (one hop).
  if (pathname.length > 1 && pathname.endsWith('/')) {
    const to = new URL(request.url)
    to.pathname = pathname.replace(/\/+$/, '')
    return withSecurityHeaders(NextResponse.redirect(to, 308))
  }

  // 1) Refresh the Supabase session cookie on every request (required by @supabase/ssr —
  //    Server Components can't write cookies). 2) Bounce signed-out users away from
  //    /admin early. The ROLE check happens server-side in admin/layout.tsx + actions.
  let response = NextResponse.next({ request })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (all) => {
          all.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          all.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user && pathname.startsWith('/admin')) {
      const to = request.nextUrl.clone()
      to.pathname = '/sign-in'
      to.search = `?next=${encodeURIComponent(pathname)}`
      return withSecurityHeaders(NextResponse.redirect(to))
    }
  }

  return withSecurityHeaders(response)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|llms.txt).*)'],
}
