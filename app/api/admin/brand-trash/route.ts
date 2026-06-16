import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/verify-admin'
import { readJson, bad, isStr, MAX } from '@/lib/validate'
import { brandSlug } from '@/lib/brand'
import { purgeBrand, purgeExpiredBrandTrash } from '@/lib/trash'

// Deleting a brand is destructive → admin only (mods can edit brands, not delete).
const BRAND_ACTIONS = new Set(['trash', 'restore', 'purge'])

const nowIso = () => new Date().toISOString()

// GET — list trashed brands (newest first) with a product count. Also
// opportunistically purges brands past the 30-day window.
export async function GET(request: Request) {
  const user = await getAdminUser(request)
  if (!user)         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden' },    { status: 403 })

  const admin = getSupabaseAdmin()
  const purged = await purgeExpiredBrandTrash()
  if (purged.length) revalidatePath('/brands')

  const { data, error } = await admin
    .from('brands')
    .select('name, logo_url, deleted_at')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach a count of products still carrying each trashed brand name.
  const items = await Promise.all((data ?? []).map(async b => {
    const { count } = await admin.from('flashlights').select('id', { count: 'exact', head: true }).eq('brand', b.name)
    return { ...b, productCount: count ?? 0 }
  }))

  return NextResponse.json({ items, purged: purged.length })
}

// POST — { name, action: 'trash'|'restore'|'purge', mode?, targetBrand? }
//   trash + mode 'products' : trash the brand and all its live flashlights
//   trash + mode 'reassign' : move its flashlights to targetBrand, then trash the (now empty) brand
export async function POST(request: Request) {
  const user = await getAdminUser(request)
  if (!user)         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden' },    { status: 403 })

  const body = await readJson(request)
  if (!body) return bad('Invalid request body')
  const { name, action, mode, targetBrand } = body as {
    name?: string; action?: string; mode?: string; targetBrand?: string
  }
  if (!isStr(name, MAX.name)) return bad('Invalid brand name')
  if (!action || !BRAND_ACTIONS.has(action)) return bad('Unknown action')

  const admin = getSupabaseAdmin()

  // Slugs of products touched by this op, so we can revalidate their detail pages.
  async function affectedSlugs(brand: string): Promise<string[]> {
    const { data } = await admin.from('flashlights').select('slug').eq('brand', brand)
    return (data ?? []).map((r: { slug: string }) => r.slug)
  }

  if (action === 'purge') {
    const slugs = await affectedSlugs(name as string)
    await purgeBrand(name as string)
    for (const s of slugs) revalidatePath(`/${s}`)
    revalidatePath('/brands'); revalidatePath('/', 'layout'); revalidatePath('/sitemap.xml')
    revalidatePath(`/brand/${brandSlug(name as string)}`)
    return NextResponse.json({ ok: true })
  }

  if (action === 'restore') {
    // Bring the brand back and un-trash any of its trashed products.
    await admin.from('brands').update({ deleted_at: null }).eq('name', name)
    await admin.from('flashlights').update({ deleted_at: null }).eq('brand', name).not('deleted_at', 'is', null)
    const slugs = await affectedSlugs(name as string)
    for (const s of slugs) revalidatePath(`/${s}`)
    revalidatePath('/brands'); revalidatePath('/', 'layout'); revalidatePath('/sitemap.xml')
    revalidatePath(`/brand/${brandSlug(name as string)}`)
    return NextResponse.json({ ok: true })
  }

  // action === 'trash'
  if (mode === 'reassign') {
    if (!isStr(targetBrand, MAX.name)) return bad('Invalid target brand')
    if (targetBrand === name) return bad('Target brand must be different')
    const { data: target } = await admin.from('brands').select('name, deleted_at').eq('name', targetBrand).maybeSingle()
    // Target must be a real, live brand (has a brands row or live products).
    const { count: targetProducts } = await admin
      .from('flashlights').select('id', { count: 'exact', head: true })
      .eq('brand', targetBrand).is('deleted_at', null)
    if ((!target || target.deleted_at) && !(targetProducts ?? 0)) return bad('Target brand not found')

    const movedSlugs = await affectedSlugs(name as string)
    // Move every product (keeping slugs stable so existing links keep working).
    await admin.from('flashlights').update({ brand: targetBrand, updated_at: nowIso() }).eq('brand', name)
    // Trash the now-empty brand (create a row if there was no metadata).
    await admin.from('brands').upsert({ name, deleted_at: nowIso() }, { onConflict: 'name' })

    for (const s of movedSlugs) revalidatePath(`/${s}`)
    revalidatePath('/brands'); revalidatePath('/', 'layout'); revalidatePath('/sitemap.xml')
    revalidatePath(`/brand/${brandSlug(name as string)}`)
    revalidatePath(`/brand/${brandSlug(targetBrand as string)}`)
    return NextResponse.json({ ok: true, moved: movedSlugs.length })
  }

  if (mode === 'products') {
    const slugs = await affectedSlugs(name as string)
    await admin.from('flashlights').update({ deleted_at: nowIso() }).eq('brand', name).is('deleted_at', null)
    await admin.from('brands').upsert({ name, deleted_at: nowIso() }, { onConflict: 'name' })
    for (const s of slugs) revalidatePath(`/${s}`)
    revalidatePath('/brands'); revalidatePath('/', 'layout'); revalidatePath('/sitemap.xml')
    revalidatePath(`/brand/${brandSlug(name as string)}`)
    return NextResponse.json({ ok: true })
  }

  return bad('Invalid mode')
}
