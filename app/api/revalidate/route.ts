import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const { slug, all, force } = await request.json().catch(() => ({}))

  if (force) {
    // Force clear ALL flashlight pages (e.g. after direct DB edit)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
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
