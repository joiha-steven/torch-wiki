import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getAdminUser } from '@/lib/verify-admin'

// Authorize either with a shared secret (server-side scripts / seed jobs via the
// `x-revalidate-secret` header) or with an admin/moderator session bearer token
// (the admin dashboard and auto-approve flow). Without this, anyone could spam
// `{force:true}` and force-revalidate every page — a needless load/cost vector.
async function isAuthorized(request: Request): Promise<boolean> {
  const secret = process.env.REVALIDATE_SECRET
  if (secret && request.headers.get('x-revalidate-secret') === secret) return true

  const user = await getAdminUser(request)
  return !!user && (user.isAdmin || user.isModerator)
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
