import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdmin()
  const { data: { user } } = await admin.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: callerProfile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  const isAdmin = callerProfile?.is_admin === true || user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, is_moderator } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const target = users.find(u => u.email === email)
  if (!target) return NextResponse.json({ error: 'No account found with that email.' }, { status: 404 })

  if (target.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Can't change role of the owner account." }, { status: 400 })
  }

  await admin.from('profiles').upsert({ id: target.id, is_moderator }, { onConflict: 'id' })

  return NextResponse.json({ ok: true, email: target.email, is_moderator })
}
