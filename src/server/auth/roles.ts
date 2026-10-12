import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/server/db'
import { users } from '@/server/db/schema'
import { getSessionUser } from './supabase'

export type AppRole = 'SUPER_ADMIN' | 'MODERATOR' | 'RECORD_HOLDER' | 'PUBLIC_USER'
export const STAFF_ROLES: readonly AppRole[] = ['MODERATOR', 'SUPER_ADMIN']

/** Role of the signed-in user, read from public.users (same source as current_app_role()). */
export async function getUserRole(userId: string): Promise<AppRole | null> {
  if (!db) return null
  const rows = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1)
  return (rows[0]?.role as AppRole | undefined) ?? null
}

/** Current user + role, or null when signed out. */
export async function getViewer() {
  const user = await getSessionUser()
  if (!user) return null
  const role = await getUserRole(user.id)
  return { user, role }
}

/**
 * Page/layout guard. Signed-out → sign-in (with return path).
 * Signed-in without a staff role → home. Fails closed if the DB is unreachable.
 */
export async function requireStaff(returnTo = '/admin/dashboard') {
  const viewer = await getViewer()
  if (!viewer) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`)
  if (!viewer.role || !STAFF_ROLES.includes(viewer.role)) redirect('/?denied=1')
  return viewer
}

/** Server-action guard: returns null instead of redirecting. */
export async function getStaffOrNull() {
  const viewer = await getViewer()
  if (!viewer?.role || !STAFF_ROLES.includes(viewer.role)) return null
  return viewer
}
