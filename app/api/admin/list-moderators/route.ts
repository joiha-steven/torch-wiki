import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdmin()
  const { data: { user } } = await admin.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: callerProfile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  const isAdmin = callerProfile?.is_admin === true || user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: modProfiles } = await admin.from('profiles').select('id, nickname').eq('is_moderator', true)
  if (!modProfiles?.length) return NextResponse.json({ moderators: [] })

  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = Object.fromEntries(users.map(u => [u.id, u.email]))

  const moderators = modProfiles.map(p => ({
    id: p.id,
    email: emailMap[p.id] ?? '—',
    nickname: p.nickname ?? null,
  }))

  return NextResponse.json({ moderators })
}
