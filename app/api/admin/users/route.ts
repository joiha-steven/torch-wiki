import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/verify-admin'
import { supabase as anonClient } from '@/lib/supabase'
import { SITE_URL } from '@/lib/seo'
import { isUuid, bad } from '@/lib/validate'

const USER_ACTIONS = new Set(['reset_password', 'ban', 'unban', 'delete'])

// GET /api/admin/users?q=search&page=1
export async function GET(request: Request) {
  const user = await getAdminUser(request)
  if (!user)         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden' },    { status: 403 })

  const admin = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const q       = searchParams.get('q')?.toLowerCase() ?? ''
  const page    = parseInt(searchParams.get('page') ?? '1')
  const perPage = 20

  const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: profiles } = await admin.from('profiles').select('id, nickname, is_admin, is_moderator')
  const profileMap: Record<string, { nickname: string | null; is_admin: boolean; is_moderator: boolean }> =
    Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  const filtered = q
    ? users.filter(u =>
        u.email?.toLowerCase().includes(q) ||
        (profileMap[u.id]?.nickname ?? '').toLowerCase().includes(q)
      )
    : users

  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const result = paginated.map(u => ({
    id:           u.id,
    email:        u.email ?? '—',
    nickname:     profileMap[u.id]?.nickname ?? null,
    is_admin:     profileMap[u.id]?.is_admin ?? false,
    is_moderator: profileMap[u.id]?.is_moderator ?? false,
    banned:       !!u.banned_until && new Date(u.banned_until) > new Date(),
    created_at:   u.created_at,
    last_sign_in: u.last_sign_in_at ?? null,
  }))

  return NextResponse.json({ users: result, total: filtered.length })
}

// POST /api/admin/users
export async function POST(request: Request) {
  const user = await getAdminUser(request)
  if (!user)         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden' },    { status: 403 })

  const admin = getSupabaseAdmin()
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  const { targetId, action } = body
  if (!targetId || !action) return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  if (!isUuid(targetId)) return bad('Invalid targetId')
  if (!USER_ACTIONS.has(action)) return bad('Unknown action')

  const { data: { user: target } } = await admin.auth.admin.getUserById(targetId)
  if (target?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Can't modify the owner account." }, { status: 403 })
  }

  switch (action) {
    case 'reset_password': {
      if (!target?.email) return NextResponse.json({ error: 'User has no email.' }, { status: 400 })
      const { error } = await anonClient.auth.resetPasswordForEmail(target.email, {
        redirectTo: `${SITE_URL}/reset-password`,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, message: 'Password reset email sent.' })
    }
    case 'ban': {
      const { error } = await admin.auth.admin.updateUserById(targetId, { ban_duration: '87600h' })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }
    case 'unban': {
      const { error } = await admin.auth.admin.updateUserById(targetId, { ban_duration: 'none' })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }
    case 'delete': {
      const { error } = await admin.auth.admin.deleteUser(targetId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}
