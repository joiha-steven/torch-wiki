import { del } from '@vercel/blob'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Trashed flashlights are kept (unpublished) for this many days, then permanently
// purged (DB rows + Blob assets) by the cron job / opportunistically on trash view.
export const TRASH_RETENTION_DAYS = 30

/**
 * Permanently delete a flashlight: its Vercel Blob assets (primary image, extra
 * images, manuals) then its DB rows. Best-effort on Blob — a missing/foreign
 * blob must not block the DB delete. Only Vercel Blob URLs are deleted; external
 * or legacy hosts are left alone.
 */
export async function purgeFlashlight(id: string): Promise<void> {
  const admin = getSupabaseAdmin()
  const { data: fl } = await admin
    .from('flashlights')
    .select('image_url, manual_url, manual_urls, flashlight_images(url)')
    .eq('id', id)
    .single()
  if (!fl) return

  const urls: string[] = []
  if (fl.image_url) urls.push(fl.image_url as string)
  if (fl.manual_url) urls.push(fl.manual_url as string)
  for (const m of (fl.manual_urls ?? []) as string[]) if (m) urls.push(m)
  for (const img of (fl.flashlight_images ?? []) as { url: string }[]) if (img?.url) urls.push(img.url)

  const blobUrls = urls.filter(u => u.includes('.public.blob.vercel-storage.com'))
  await Promise.all(blobUrls.map(u => del(u).catch(() => {})))

  await admin.from('flashlight_images').delete().eq('flashlight_id', id)
  await admin.from('flashlights').delete().eq('id', id)
}

/**
 * Purge every trashed flashlight past the retention window. Returns the purged
 * slugs so the caller can revalidate those paths.
 */
export async function purgeExpiredTrash(): Promise<string[]> {
  const admin = getSupabaseAdmin()
  const cutoff = new Date(Date.now() - TRASH_RETENTION_DAYS * 86_400_000).toISOString()
  const { data } = await admin
    .from('flashlights')
    .select('id, slug')
    .not('deleted_at', 'is', null)
    .lt('deleted_at', cutoff)
  const rows = (data ?? []) as { id: string; slug: string }[]
  for (const r of rows) await purgeFlashlight(r.id)
  return rows.map(r => r.slug)
}
