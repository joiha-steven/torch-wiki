import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
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

  // Only the admin (is_admin = true or owner email) can manage moderators
  const { data: callerProfile } = await admin
    .from('profiles').select('is_admin').eq('id', user.id).single()
  const isOwner = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
  if (!callerProfile?.is_admin && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email, is_moderator } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  // Look up user by email
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const target = users.find(u => u.email === email)
  if (!target) return NextResponse.json({ error: 'No account found with that email.' }, { status: 404 })

  // Cannot grant/revoke moderator on the admin account itself
  if (target.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Can't change role of the owner account." }, { status: 400 })
  }

  await admin.from('profiles').upsert({ id: target.id, is_moderator }, { onConflict: 'id' })

  return NextResponse.json({ ok: true, email: target.email, is_moderator })
}
