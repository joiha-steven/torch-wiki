/**
 * Rewrite Vercel Blob PDF URLs to go through the Cloudflare CDN proxy.
 * Only used for PDF/manual files — images stay on Vercel Blob directly.
 *
 * Raw:  https://73qdbljatmx1zwrw.public.blob.vercel-storage.com/flashlights/slug/manual.pdf
 * CDN:  https://cdn-torch.edc.wiki/flashlights/slug/manual.pdf
 *
 * Falls back to original URL if NEXT_PUBLIC_CDN_DOMAIN is not set (local dev).
 */

const BLOB_HOST = '73qdbljatmx1zwrw.public.blob.vercel-storage.com'
const CDN_DOMAIN = process.env.NEXT_PUBLIC_CDN_DOMAIN ?? ''

export function cdnUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (!CDN_DOMAIN) return url
  if (!url.includes(BLOB_HOST)) return url
  return url.replace(`https://${BLOB_HOST}`, `https://${CDN_DOMAIN}`)
}
