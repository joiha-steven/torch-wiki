import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Authorize either with a shared secret (server-side scripts / seed jobs via the
// `x-revalidate-secret` header) or with an admin/moderator session bearer token
// (the admin dashboard and auto-approve flow). Without this, anyone could spam
// `{force:true}` and force-revalidate every page — a needless load/cost vector.
async function isAuthorized(request: Request): Promise<boolean> {
  const secret = process.env.REVALIDATE_SECRET
  if (secret && request.headers.get('x-revalidate-secret') === secret) return true

  const token = (request.headers.get('authorization') ?? '').replace('Bearer ', '')
  if (!token) return false

  const admin = getSupabaseAdmin()
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return false
  if (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) return true

  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin, is_moderator')
    .eq('id', user.id)
    .single()
  return !!(profile?.is_admin || profile?.is_moderator)
}

export async function POST(request: Request) {
  const { slug, all, force } = await request.json().catch(() => ({}))

  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (force) {
    // Force clear ALL flashlight pages (e.g. after direct DB edit)
    const supabase = getSupabaseAdmin()
    const { data } = await supabase.from('flashlights').select('slug')
    for (const f of data ?? []) revalidatePath(`/${f.slug}`)
    revalidatePath('/', 'layout')
    revalidatePath('/sitemap.xml')
    return NextResponse.json({ revalidated: true, count: data?.length ?? 0 })
  }

  if (all) {
    // New flashlight added — revalidate browse layout + sitemap
    revalidatePath('/', 'layout')
    revalidatePath('/sitemap.xml')
  } else if (slug) {
    // Specific flashlight edited
    revalidatePath(`/${slug}`)
  }

  return NextResponse.json({ revalidated: true })
}
