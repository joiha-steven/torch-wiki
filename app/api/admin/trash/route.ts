import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/verify-admin'
import { readJson, bad, isUuid } from '@/lib/validate'
import { purgeFlashlight, purgeExpiredTrash } from '@/lib/trash'

// Deleting flashlights is destructive (and permanent after purge) → admin only,
// not moderators.
const TRASH_ACTIONS = new Set(['trash', 'restore', 'purge'])

// GET — list trashed flashlights (newest first). Also opportunistically purges
// anything past the retention window so the 30-day rule holds even without cron.
export async function GET(request: Request) {
  const user = await getAdminUser(request)
  if (!user)         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden' },    { status: 403 })

  const admin = getSupabaseAdmin()
  const purgedSlugs = await purgeExpiredTrash()
  for (const slug of purgedSlugs) revalidatePath(`/${slug}`)
  if (purgedSlugs.length) revalidatePath('/', 'layout')

  const { data, error } = await admin
    .from('flashlights')
    .select('id, brand, model, slug, image_url, category, max_lumens, deleted_at')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [], purged: purgedSlugs.length })
}

// POST — { id, action: 'trash' | 'restore' | 'purge' }
export async function POST(request: Request) {
  const user = await getAdminUser(request)
  if (!user)         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden' },    { status: 403 })

  const body = await readJson(request)
  if (!body) return bad('Invalid request body')
  const { id, action } = body as { id?: string; action?: string }
  if (!isUuid(id)) return bad('Invalid id')
  if (!action || !TRASH_ACTIONS.has(action)) return bad('Unknown action')

  const admin = getSupabaseAdmin()
  const { data: fl } = await admin.from('flashlights').select('slug').eq('id', id).single()
  if (!fl) return NextResponse.json({ error: 'Flashlight not found' }, { status: 404 })

  if (action === 'purge') {
    await purgeFlashlight(id as string)
  } else {
    const { error } = await admin
      .from('flashlights')
      .update({ deleted_at: action === 'trash' ? new Date().toISOString() : null })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Refresh the affected detail page + browse so the change shows immediately.
  revalidatePath(`/${fl.slug}`)
  revalidatePath('/', 'layout')
  revalidatePath('/sitemap.xml')

  return NextResponse.json({ ok: true })
}
