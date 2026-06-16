import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'torch.EDC.wiki',
    short_name: 'torch.EDC',
    description: 'Community flashlight reference database',
    lang: 'en',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    // Match the app surface so the OS launch/splash screen doesn't flash black
    // before the app paints. Light surface = #f6f6f3 (see app/globals.css).
    background_color: '#f6f6f3',
    theme_color: '#f6f6f3',
    orientation: 'portrait-primary',
    categories: ['reference', 'productivity', 'utilities'],
    icons: [
      // Full-bleed logo for normal icon slots (also used as the iOS touch icon,
      // which rounds its own corners).
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Padded variants so Android's adaptive-icon crop never clips the wordmark.
      { src: '/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
