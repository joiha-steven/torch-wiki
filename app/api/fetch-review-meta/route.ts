import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Reject obvious internal / private hosts to limit SSRF. (Best-effort: covers
// the common cases without doing DNS resolution.)
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true
  if (h === '::1' || h === '0.0.0.0') return true
  // IPv4 private / loopback / link-local (incl. cloud metadata 169.254.169.254)
  if (/^127\./.test(h)) return true
  if (/^10\./.test(h)) return true
  if (/^192\.168\./.test(h)) return true
  if (/^169\.254\./.test(h)) return true
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h)) return true
  return false
}

function pickMeta(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return m[1].trim()
  }
  return null
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

export async function POST(request: Request) {
  // Require a logged-in user (any) — this proxies arbitrary external fetches.
  const token = (request.headers.get('authorization') ?? '').replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = getSupabaseAdmin()
  const { data: { user }, error: authErr } = await admin.auth.getUser(token)
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url } = (await request.json().catch(() => ({}))) as { url?: string }
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  let parsed: URL
  try { parsed = new URL(url) } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only http(s) URLs are allowed' }, { status: 400 })
  }
  if (isBlockedHost(parsed.hostname)) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 400 })
  }

  const host = parsed.hostname.replace(/^www\./, '')
  const type = /youtube\.com|youtu\.be|vimeo\.com/.test(host) ? 'video' : 'article'

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; torchEDCwikiBot/1.0; +https://torch.edc.wiki)' },
    }).finally(() => clearTimeout(timer))

    if (!res.ok) {
      return NextResponse.json({ error: `Fetch failed (${res.status})`, type, siteName: host }, { status: 200 })
    }

    // Read at most ~512KB of HTML — meta tags live in <head>
    const raw = await res.text()
    const html = raw.slice(0, 512 * 1024)

    const title = pickMeta(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
      /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
      /<title[^>]*>([^<]+)<\/title>/i,
    ])

    const published = pickMeta(html, [
      /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']article:published_time["']/i,
      /<meta[^>]+itemprop=["']datePublished["'][^>]+content=["']([^"']+)["']/i,
      /"datePublished"\s*:\s*"([^"]+)"/i,
      /<meta[^>]+name=["']date["'][^>]+content=["']([^"']+)["']/i,
      /<time[^>]+datetime=["']([^"']+)["']/i,
    ])

    let published_at: string | null = null
    if (published) {
      const d = new Date(published)
      if (!isNaN(d.getTime())) published_at = d.toISOString()
    }

    return NextResponse.json({
      title: title ? decodeEntities(title) : null,
      published_at,
      type,
      siteName: host,
    })
  } catch {
    // Network error / timeout — return graceful empty result so the user can fill manually
    return NextResponse.json({ title: null, published_at: null, type, siteName: host })
  }
}
