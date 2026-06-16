import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/verify-admin'
import { readJson, bad, isUuid } from '@/lib/validate'
import { purgeFlashlight, purgeExpiredTrash } from '@/lib/trash'

// Deleting flashlights is destructive (and permanent after purge) → admin only.
const ID_ACTIONS = new Set(['trash', 'restore', 'purge'])
const SUB_ACTIONS = new Set(['approve_suggestion', 'reject_suggestion'])
const BULK_ACTIONS = new Set(['purge_all', 'approve_all_suggestions'])

const nowIso = () => new Date().toISOString()

// GET — trashed flashlights + pending mod delete suggestions. Also opportunistically
// purges anything past the retention window so the 30-day rule holds without cron.
export async function GET(request: Request) {
  const user = await getAdminUser(request)
  if (!user)         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden' },    { status: 403 })

  const admin = getSupabaseAdmin()
  const purgedSlugs = await purgeExpiredTrash()
  for (const slug of purgedSlugs) revalidatePath(`/${slug}`)
  if (purgedSlugs.length) revalidatePath('/', 'layout')

  const [{ data: items, error }, { data: subs }] = await Promise.all([
    admin.from('flashlights')
      .select('id, brand, model, slug, image_url, category, max_lumens, deleted_at')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }),
    admin.from('flashlight_submissions')
      .select('id, target_id, data, created_at, user_id')
      .eq('type', 'delete').eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // user_id → auth.users (not profiles), so resolve nicknames in a second query.
  const rows = (subs ?? []) as { id: string; target_id: string | null; data: unknown; created_at: string; user_id: string }[]
  const uids = [...new Set(rows.map(s => s.user_id).filter(Boolean))]
  const { data: profs } = uids.length
    ? await admin.from('profiles').select('id, nickname').in('id', uids)
    : { data: [] }
  const nickById = Object.fromEntries((profs ?? []).map(p => [p.id, p.nickname]))
  const suggestions = rows.map(s => ({
    id: s.id, target_id: s.target_id, data: s.data, created_at: s.created_at,
    nickname: nickById[s.user_id] ?? null,
  }))

  return NextResponse.json({ items: items ?? [], suggestions, purged: purgedSlugs.length })
}

async function softDelete(id: string) {
  const admin = getSupabaseAdmin()
  const { data: fl } = await admin.from('flashlights').select('slug').eq('id', id).single()
  if (!fl) return null
  await admin.from('flashlights').update({ deleted_at: nowIso() }).eq('id', id)
  revalidatePath(`/${fl.slug}`)
  return fl.slug
}

export async function POST(request: Request) {
  const user = await getAdminUser(request)
  if (!user)         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden' },    { status: 403 })

  const body = await readJson(request)
  if (!body) return bad('Invalid request body')
  const { id, action, submissionId } = body as { id?: string; action?: string; submissionId?: string }
  if (!action) return bad('Missing action')

  const admin = getSupabaseAdmin()
  const revalidateBrowse = () => { revalidatePath('/', 'layout'); revalidatePath('/sitemap.xml') }

  // ── Bulk: empty the trash / approve every pending delete suggestion ──────────
  if (BULK_ACTIONS.has(action)) {
    if (action === 'purge_all') {
      const { data } = await admin.from('flashlights').select('id, slug').not('deleted_at', 'is', null)
      for (const r of (data ?? []) as { id: string; slug: string }[]) {
        await purgeFlashlight(r.id); revalidatePath(`/${r.slug}`)
      }
      revalidateBrowse()
      return NextResponse.json({ ok: true, count: data?.length ?? 0 })
    }
    // approve_all_suggestions
    const { data: subs } = await admin
      .from('flashlight_submissions').select('id, target_id')
      .eq('type', 'delete').eq('status', 'pending')
    for (const s of (subs ?? []) as { id: string; target_id: string | null }[]) {
      if (s.target_id) await softDelete(s.target_id)
      await admin.from('flashlight_submissions').update({ status: 'approved', reviewed_at: nowIso() }).eq('id', s.id)
    }
    revalidateBrowse()
    return NextResponse.json({ ok: true, count: subs?.length ?? 0 })
  }

  // ── Act on a single delete suggestion ───────────────────────────────────────
  if (SUB_ACTIONS.has(action)) {
    if (!isUuid(submissionId)) return bad('Invalid submissionId')
    const { data: sub } = await admin
      .from('flashlight_submissions').select('target_id').eq('id', submissionId).single()
    if (!sub) return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })
    if (action === 'approve_suggestion') {
      if (sub.target_id) await softDelete(sub.target_id)
      await admin.from('flashlight_submissions').update({ status: 'approved', reviewed_at: nowIso() }).eq('id', submissionId)
      revalidateBrowse()
    } else {
      await admin.from('flashlight_submissions').update({ status: 'rejected', reviewed_at: nowIso() }).eq('id', submissionId)
    }
    return NextResponse.json({ ok: true })
  }

  // ── Single flashlight by id: trash / restore / purge ────────────────────────
  if (!ID_ACTIONS.has(action)) return bad('Unknown action')
  if (!isUuid(id)) return bad('Invalid id')
  const { data: fl } = await admin.from('flashlights').select('slug').eq('id', id).single()
  if (!fl) return NextResponse.json({ error: 'Flashlight not found' }, { status: 404 })

  if (action === 'purge') {
    await purgeFlashlight(id as string)
  } else {
    const { error } = await admin
      .from('flashlights')
      .update({ deleted_at: action === 'trash' ? nowIso() : null })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidatePath(`/${fl.slug}`)
  revalidateBrowse()
  return NextResponse.json({ ok: true })
}
