import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { purgeExpiredTrash, purgeExpiredBrandTrash } from '@/lib/trash'

// Daily auto-purge of trashed flashlights past the 30-day window (DB + Blob).
// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
// We REQUIRE that secret — without it the endpoint is disabled (503) so it can
// never be triggered by a stranger. (The admin Trash view also purges expired
// items opportunistically, so the 30-day rule still holds if cron is off.)
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'Cron disabled (no CRON_SECRET)' }, { status: 503 })
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const slugs = await purgeExpiredTrash()
  for (const s of slugs) revalidatePath(`/${s}`)
  const brands = await purgeExpiredBrandTrash()
  if (slugs.length || brands.length) {
    revalidatePath('/', 'layout')
    revalidatePath('/sitemap.xml')
    revalidatePath('/brands')
  }
  return NextResponse.json({ purged: slugs.length, brandsPurged: brands.length })
}
