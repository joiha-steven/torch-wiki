import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Blob images are immutable (random-suffixed URLs) — cache the optimized
    // variants for a year so the same image isn't re-optimized repeatedly.
    minimumCacheTTL: 31536000,
    // Only optimize images from hosts we actually use. All product images live
    // on Vercel Blob; cdn.shopify.com is a safety net for brand seeds before
    // they're migrated to Blob. (Was '**' — effectively an open optimizer proxy.)
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
    ],
  },
}

export default nextConfig

// CDN domain for Vercel Blob assets
// Raw blob store: 73qdbljatmx1zwrw.public.blob.vercel-storage.com
// CDN proxy:      cdn-torch.edc.wiki (Cloudflare Worker)
