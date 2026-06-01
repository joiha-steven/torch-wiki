import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const supabaseUser = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Only admins can view the moderator list
  const { data: callerProfile } = await admin
    .from('profiles').select('is_admin').eq('id', user.id).single()
  const isOwner = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
  if (!callerProfile?.is_admin && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: modProfiles } = await admin
    .from('profiles').select('id, nickname').eq('is_moderator', true)

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
