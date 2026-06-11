import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { brandSlug } from '@/lib/brand'

async function verifyAdmin(request: Request) {
  const token = (request.headers.get('Authorization') ?? '').replace('Bearer ', '')
  if (!token) return null
  const admin = getSupabaseAdmin()
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return null
  if (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) return user
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin, is_moderator')
    .eq('id', user.id)
    .single()
  return (profile?.is_admin || profile?.is_moderator) ? user : null
}

// Fields a brand row accepts (name is the primary key / lookup, never changed here)
const ALLOWED = ['country', 'made_in', 'founded_year', 'headquarters', 'website', 'about', 'logo_url'] as const

function cleanData(data: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const k of ALLOWED) {
    if (k in data) out[k] = data[k] === '' ? null : data[k]
  }
  return out
}

export async function PATCH(request: Request) {
  const user = await verifyAdmin(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null) as { name?: string; data?: Record<string, unknown> } | null
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  const { name, data } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Missing brand name' }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { error } = await admin
    .from('brands')
    .upsert({ name, ...cleanData(data ?? {}), updated_by: user.id, updated_at: new Date().toISOString() }, { onConflict: 'name' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const slug = brandSlug(name)
  revalidatePath(`/brand/${slug}`)
  revalidatePath('/', 'layout')

  return NextResponse.json({ ok: true, slug })
}
