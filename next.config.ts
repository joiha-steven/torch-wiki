import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig

// CDN domain for Vercel Blob assets
// Raw blob store: 73qdbljatmx1zwrw.public.blob.vercel-storage.com
// CDN proxy:      cdn-torch.edc.wiki (Cloudflare Worker)
