import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/verify-admin'
import { brandSlug } from '@/lib/brand'

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
  const user = await getAdminUser(request)
  if (!user || (!user.isAdmin && !user.isModerator)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
