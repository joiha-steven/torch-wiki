import { getSupabaseAdmin } from './supabase-admin'

export type AdminUser = {
  id: string
  email: string | null
  isAdmin: boolean // profiles.is_admin OR the bootstrap admin email
  isModerator: boolean // profiles.is_moderator
}

function bearerToken(request: Request): string {
  const header = request.headers.get('Authorization') ?? request.headers.get('authorization') ?? ''
  return header.replace('Bearer ', '')
}

/**
 * Authenticate the request's bearer token and resolve the caller's admin/mod
 * flags. Returns null when the token is missing or invalid.
 *
 * Permission decisions are left to the caller so each route keeps its own
 * level: role-management routes require `isAdmin`; content routes accept
 * `isAdmin || isModerator`. The bootstrap admin email is checked server-side
 * only (it never ships to the client — see app/admin/page.tsx).
 */
export async function getAdminUser(request: Request): Promise<AdminUser | null> {
  const token = bearerToken(request)
  if (!token) return null

  const admin = getSupabaseAdmin()
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return null

  const bootstrapEmail = process.env.ADMIN_EMAIL ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL
  const isBootstrap = !!bootstrapEmail && user.email === bootstrapEmail

  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin, is_moderator')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email ?? null,
    isAdmin: isBootstrap || !!profile?.is_admin,
    isModerator: !!profile?.is_moderator,
  }
}
