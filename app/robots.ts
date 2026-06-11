import { MetadataRoute } from 'next'

const BASE = 'https://torch.edc.wiki'

// Private / non-content routes kept out of all crawlers
const DISALLOW = ['/admin', '/api/', '/my', '/account', '/reset-password', '/change-password']

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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      ...AI_BOTS.map(userAgent => ({ userAgent, allow: '/', disallow: DISALLOW })),
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
