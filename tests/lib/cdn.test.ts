import { describe, it, expect, afterEach, vi } from 'vitest'

const BLOB = 'https://73qdbljatmx1zwrw.public.blob.vercel-storage.com/flashlights/x/manual.pdf'

// cdn.ts reads NEXT_PUBLIC_CDN_DOMAIN once at module load, so each scenario
// re-imports the module with a fresh env via resetModules + stubEnv.
async function loadCdn(domain?: string) {
  vi.resetModules()
  if (domain === undefined) vi.stubEnv('NEXT_PUBLIC_CDN_DOMAIN', '')
  else vi.stubEnv('NEXT_PUBLIC_CDN_DOMAIN', domain)
  return (await import('@/lib/cdn')).cdnUrl
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('cdnUrl', () => {
  it('returns null for null/undefined input', async () => {
    const cdnUrl = await loadCdn('cdn-torch.edc.wiki')
    expect(cdnUrl(null)).toBeNull()
    expect(cdnUrl(undefined)).toBeNull()
  })
  it('returns the original URL unchanged when CDN_DOMAIN is unset (local dev)', async () => {
    const cdnUrl = await loadCdn('')
    expect(cdnUrl(BLOB)).toBe(BLOB)
  })
  it('rewrites the Blob host to the CDN domain when configured', async () => {
    const cdnUrl = await loadCdn('cdn-torch.edc.wiki')
    expect(cdnUrl(BLOB)).toBe('https://cdn-torch.edc.wiki/flashlights/x/manual.pdf')
  })
  it('leaves non-Blob URLs untouched even when CDN is configured', async () => {
    const cdnUrl = await loadCdn('cdn-torch.edc.wiki')
    const other = 'https://example.com/foo.pdf'
    expect(cdnUrl(other)).toBe(other)
  })
})
