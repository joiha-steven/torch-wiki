import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { MAX } from '@/lib/validate'

// Reject obvious internal / private hosts to limit SSRF. (Best-effort: covers
// the common literal-IP cases without doing DNS resolution — DNS-rebinding is
// out of scope here; the endpoint is auth-gated and rate-limited at the edge.)
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '') // strip IPv6 brackets
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.lan') || h.endsWith('.internal')) return true
  if (h === 'metadata.google.internal') return true
  // IPv6 loopback / unspecified / unique-local (fc00::/7) / link-local (fe80::/10)
  if (h === '::1' || h === '::' || h === '0.0.0.0') return true
  if (/^f[cd][0-9a-f]*:/.test(h)) return true            // fc00::/7
  if (/^fe[89ab][0-9a-f]*:/.test(h)) return true         // fe80::/10
  if (/^::ffff:/.test(h)) return true                    // IPv4-mapped IPv6
  // IPv4 private / loopback / link-local (incl. cloud metadata 169.254.169.254)
  if (/^127\./.test(h)) return true
  if (/^10\./.test(h)) return true
  if (/^192\.168\./.test(h)) return true
  if (/^169\.254\./.test(h)) return true
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h)) return true
  if (/^100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\./.test(h)) return true // CGNAT 100.64/10
  return false
}

// Fetch that follows redirects manually, re-validating each hop's host so a
// crafted page can't redirect us into the private network (SSRF via redirect).
async function safeFetch(startUrl: string, init: RequestInit, maxHops = 4): Promise<Response | null> {
  let current = startUrl
  for (let i = 0; i < maxHops; i++) {
    const res = await fetch(current, { ...init, redirect: 'manual' })
    if (res.status < 300 || res.status >= 400) return res
    const loc = res.headers.get('location')
    if (!loc) return res
    let next: URL
    try { next = new URL(loc, current) } catch { return null }
    if ((next.protocol !== 'http:' && next.protocol !== 'https:') || isBlockedHost(next.hostname)) return null
    current = next.toString()
  }
  return null // too many redirects
}

function pickMeta(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return m[1].trim()
  }
  return null
}

// oEmbed gives a clean title without hitting YouTube's consent wall. Vimeo's
// oEmbed also returns upload_date; YouTube's does not (date comes from HTML).
async function fetchOEmbed(targetUrl: string, host: string): Promise<{ title: string | null; published_at: string | null } | null> {
  let endpoint: string | null = null
  if (/youtube\.com|youtu\.be/.test(host)) endpoint = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(targetUrl)}`
  else if (/vimeo\.com/.test(host)) endpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(targetUrl)}`
  if (!endpoint) return null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; torchEDCwikiBot/1.0; +https://torch.edc.wiki)' },
    }).finally(() => clearTimeout(timer))
    if (!res.ok) return null
    const j = (await res.json()) as { title?: string; upload_date?: string }
    let published_at: string | null = null
    if (j.upload_date) {
      const d = new Date(j.upload_date.replace(' ', 'T'))
      if (!isNaN(d.getTime())) published_at = d.toISOString()
    }
    return { title: j.title ? decodeEntities(j.title) : null, published_at }
  } catch {
    return null
  }
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
  if (typeof url !== 'string' || url.length > MAX.url) {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

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

  let title: string | null = null
  let published_at: string | null = null

  // 1) Video hosts: oEmbed is reliable (no consent wall, tiny payload). Gives a
  //    clean title for YouTube/Vimeo; Vimeo also returns upload_date.
  if (type === 'video') {
    const oe = await fetchOEmbed(parsed.toString(), host)
    if (oe) { title = oe.title; published_at = oe.published_at }
  }

  // 2) Fetch the page HTML for anything still missing (date for YouTube,
  //    everything for normal articles). Best-effort — never fatal.
  if (!title || !published_at) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      const res = await safeFetch(parsed.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; torchEDCwikiBot/1.0; +https://torch.edc.wiki)',
          'Accept-Language': 'en-US,en;q=0.9',
          // Bypass Google's consent interstitial where possible
          'Cookie': 'CONSENT=YES+1; SOCS=CAI',
        },
      }).finally(() => clearTimeout(timer))

      if (res?.ok) {
        // Read up to ~2MB — YouTube pushes og:title / uploadDate past 600KB.
        const html = (await res.text()).slice(0, 2 * 1024 * 1024)

        // Content captured up to the matching quote (not [^"'] — that truncates
        // titles containing an apostrophe inside a double-quoted attribute).
        if (!title) {
          const t = pickMeta(html, [
            /<meta[^>]+property=["']og:title["'][^>]+content="([^"]*)"/i,
            /<meta[^>]+property=["']og:title["'][^>]+content='([^']*)'/i,
            /<meta[^>]+content="([^"]*)"[^>]+property=["']og:title["']/i,
            /<meta[^>]+name=["']twitter:title["'][^>]+content="([^"]*)"/i,
            /<title[^>]*>([^<]+)<\/title>/i,
          ])
          if (t) title = decodeEntities(t)
        }

        if (!published_at) {
          const p = pickMeta(html, [
            /<meta[^>]+property=["']article:published_time["'][^>]+content="([^"]*)"/i,
            /<meta[^>]+content="([^"]*)"[^>]+property=["']article:published_time["']/i,
            /<meta[^>]+itemprop=["']datePublished["'][^>]+content="([^"]*)"/i,
            /"datePublished"\s*:\s*"([^"]+)"/i,
            /"uploadDate"\s*:\s*"([^"]+)"/i,
            /"publishDate"\s*:\s*"([^"]+)"/i,
            /<meta[^>]+itemprop=["']uploadDate["'][^>]+content="([^"]*)"/i,
            /<meta[^>]+name=["']date["'][^>]+content="([^"]*)"/i,
            /<time[^>]+datetime=["']([^"']+)["']/i,
          ])
          if (p) { const d = new Date(p); if (!isNaN(d.getTime())) published_at = d.toISOString() }
        }
      }
    } catch {
      // network error / timeout — fall through with whatever oEmbed gave us
    }
  }

  return NextResponse.json({ title, published_at, type, siteName: host })
}
