import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data: { user } } = await admin.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: callerProfile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  const isAdmin = callerProfile?.is_admin === true || user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  const { email, is_moderator } = body
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
