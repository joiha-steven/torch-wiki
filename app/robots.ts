import { MetadataRoute } from 'next'
import { SITE_URL as BASE } from '@/lib/seo'

// Private / non-content routes kept out of all crawlers
const DISALLOW = ['/admin', '/api/', '/my', '/account', '/reset-password', '/change-password']

// AI crawlers also skip the image optimiser. Measured 2026-09-12 over 14 days of
// nginx logs: /_next/image was 2,515 of their fetches, the single most requested
// path on the box. Pixels cannot be quoted in an answer, so every one of those
// costs bandwidth and a Next image-optimiser render for nothing. Googlebot keeps
// the path because Google Images indexes from it.
const AI_DISALLOW = [...DISALLOW, '/_next/image']

// AI / LLM crawlers we explicitly welcome (content is community reference data
// meant to be cited). Listing them removes ambiguity about being allowed.
const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'cohere-ai',
]

// No blanket `allow: '/'` on these rules. Next emits Allow before Disallow, and a
// crawler that takes the first matching line (rather than the longest, as Google
// does) then treats `Allow: /` as permission for everything and ignores every
// Disallow below it. Verified 2026-09-12 against the live file: /admin, /api/ and
// /my all read as permitted. Omitting Allow costs nothing since robots.txt permits
// by default, and makes the Disallow list hold for simple parsers too.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', disallow: DISALLOW },
      ...AI_BOTS.map(userAgent => ({ userAgent, disallow: AI_DISALLOW })),
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
