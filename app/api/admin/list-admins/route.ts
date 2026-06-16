import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  // Verify caller is an admin
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

  // Check caller is admin
  const { data: callerProfile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const isAdminEmail = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
  if (!callerProfile?.is_admin && !isAdminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get all profiles with is_admin = true
  const { data: adminProfiles } = await admin
    .from('profiles')
    .select('id, nickname, is_admin')
    .eq('is_admin', true)

  if (!adminProfiles?.length) return NextResponse.json({ admins: [] })

  // Look up emails from auth.users
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const emailMap = Object.fromEntries(users.map(u => [u.id, u.email]))

  const admins = adminProfiles.map(p => ({
    id: p.id,
    email: emailMap[p.id] ?? '-',
    nickname: p.nickname ?? null,
  }))

  return NextResponse.json({ admins })
}
