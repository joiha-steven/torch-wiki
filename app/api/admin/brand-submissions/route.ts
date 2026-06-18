import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/verify-admin'
import { brandSlug } from '@/lib/brand'
import { isUuid, isOptStr, bad, MAX } from '@/lib/validate'

const ALLOWED = ['country', 'made_in', 'founded_year', 'headquarters', 'website', 'about', 'logo_url'] as const

export async function GET(request: Request) {
  const user = await getAdminUser(request)
  if (!user || (!user.isAdmin && !user.isModerator)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = new URL(request.url).searchParams.get('status') ?? 'pending'
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('brand_submissions')
    .select('*, profiles(nickname)')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ submissions: data ?? [] })
}

export async function PATCH(request: Request) {
  const user = await getAdminUser(request)
  if (!user || (!user.isAdmin && !user.isModerator)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null) as { id?: string; action?: 'approve' | 'reject'; reviewerNote?: string } | null
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  const { id, action, reviewerNote } = body
  if (!id || !action) return NextResponse.json({ error: 'Missing id or action' }, { status: 400 })
  if (!isUuid(id)) return bad('Invalid id')
  if (action !== 'approve' && action !== 'reject') return bad('Invalid action')
  if (!isOptStr(reviewerNote, MAX.text)) return bad('Reviewer note too long')

  const admin = getSupabaseAdmin()
  const { data: sub } = await admin.from('brand_submissions').select('*').eq('id', id).single()
  if (!sub) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })

  if (action === 'approve') {
    const data = (sub.data ?? {}) as Record<string, unknown>
    const payload: Record<string, unknown> = {
      name: sub.brand_name,
      updated_by: sub.user_id ?? null,
      updated_at: new Date().toISOString(),
    }
    for (const k of ALLOWED) if (k in data) payload[k] = data[k] === '' ? null : data[k]

    const { error: upErr } = await admin.from('brands').upsert(payload, { onConflict: 'name' })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  const { error } = await admin
    .from('brand_submissions')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewer_note: reviewerNote ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (action === 'approve') {
    revalidatePath(`/brand/${brandSlug(sub.brand_name)}`)
    revalidatePath('/', 'layout')
    revalidatePath('/log')
  }

  return NextResponse.json({ ok: true })
}
