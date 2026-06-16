import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/verify-admin'

export async function GET(request: Request) {
  const caller = await getAdminUser(request)
  if (!caller)         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!caller.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = getSupabaseAdmin()
  const { data: modProfiles } = await admin.from('profiles').select('id, nickname').eq('is_moderator', true)
  if (!modProfiles?.length) return NextResponse.json({ moderators: [] })

  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = Object.fromEntries(users.map(u => [u.id, u.email]))

  const moderators = modProfiles.map(p => ({
    id: p.id,
    email: emailMap[p.id] ?? '-',
    nickname: p.nickname ?? null,
  }))

  return NextResponse.json({ moderators })
}
