import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/verify-admin'
import { brandSlug } from '@/lib/brand'
import { isStr, bad, MAX } from '@/lib/validate'

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
  if (!isStr(name, MAX.name)) return bad('Brand name too long')
  // Cap free-text fields so a single field can't carry multi-MB payloads.
  // (Empty strings are allowed - they clear the field via cleanData.)
  if (data) {
    if (data.about != null && (typeof data.about !== 'string' || data.about.length > MAX.text)) return bad('About text too long')
    for (const k of ['website', 'logo_url', 'headquarters', 'made_in', 'country'] as const) {
      const v = data[k]
      if (v != null && (typeof v !== 'string' || v.length > MAX.url)) return bad(`Invalid ${k}`)
    }
  }

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
