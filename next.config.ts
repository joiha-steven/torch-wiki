import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Blob images are immutable (random-suffixed URLs) — cache the optimized
    // variants for a year so the same image isn't re-optimized repeatedly.
    minimumCacheTTL: 31536000,
    // Cap how many size variants Next generates per image — each (image × size)
    // is one billable Vercel transformation. Default is 8 deviceSizes + 8
    // imageSizes (lots of variants); we trimmed to 4 responsive widths that
    // actually match our layouts (cards ≤828 on retina, detail hero ≤1920) plus
    // a tiny imageSizes set for fixed thumbnails (64/80/320px usages).
    deviceSizes: [640, 828, 1080, 1920],
    imageSizes: [128, 384],
    // Only optimize images from hosts we actually use. All product images live
    // on Vercel Blob; cdn.shopify.com is a safety net for brand seeds before
    // they're migrated to Blob. (Was '**' — effectively an open optimizer proxy.)
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
    ],
  },
  // Security headers applied to every response (Vercel honours these at the edge
  // routing layer). Kept conservative so nothing breaks: no CSP here (it would
  // need to allow Supabase, Blob, GA, Turnstile, YouTube/Vimeo embeds — easy to
  // break the site), just the low-risk hardening headers + HSTS.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // force HTTPS for 2 years incl. subdomains (eligible for preload list)
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // stop browsers MIME-sniffing a response into a different type
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // don't leak full URLs to third parties on cross-origin navigation
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // disallow the site being framed elsewhere (clickjacking)
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // deny powerful APIs we never use
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig

// CDN domain for Vercel Blob assets
// Raw blob store: 73qdbljatmx1zwrw.public.blob.vercel-storage.com
// CDN proxy:      cdn-torch.edc.wiki (Cloudflare Worker)
