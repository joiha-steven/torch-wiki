import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import Providers from '@/components/Providers'
import PageFade from '@/components/PageFade'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import CookieConsent from '@/components/CookieConsent'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import { SITE_URL, SITE_NAME, OG_IMAGE } from '@/lib/seo'
import './globals.css'

// Single site-wide typeface: Inter (variable, weights 100–900). Self-hosted from
// the repo — no Google Fonts request at build or runtime; Next serves it with an
// immutable long-cache header.
const inter = localFont({
  src: './fonts/inter-variable.woff2',
  variable: '--font-inter',
  display: 'swap',
  weight: '100 900',
})

const SITE_DESC = 'Community reference database for flashlight collectors and enthusiasts — full specs, reviews, images and release history for hundreds of EDC, tactical, thrower and headlamp flashlights.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'torch.EDC.wiki — Flashlight Database',
    template: '%s — torch.EDC.wiki',
  },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  keywords: ['flashlight', 'EDC', 'torch', 'flashlight database', 'flashlight specs', 'tactical flashlight', 'thrower', 'headlamp', 'lumens', 'flashlight reviews'],
  manifest: '/manifest.webmanifest',
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: 'torch.EDC.wiki — Flashlight Database',
    description: SITE_DESC,
    url: SITE_URL,
    locale: 'en_US',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'torch.EDC.wiki — Flashlight Database' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'torch.EDC.wiki — Flashlight Database',
    description: SITE_DESC,
    images: [OG_IMAGE],
  },
  appleWebApp: {
    capable: true,
    // 'default' keeps content below the status bar and lets iOS colour the bar to
    // match the app (works for both light and dark themes). 'black-translucent'
    // would push content under the clock and force white text — unreadable on the
    // light surface.
    statusBarStyle: 'default',
    title: 'torch.EDC',
  },
  icons: {
    icon: [
      { url: '/favicon.ico',       sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    // Dedicated 180×180 filled icon — iOS rounds the corners itself, so a
    // full-bleed square (not the padded maskable one) looks right on the home screen.
    apple: '/apple-touch-icon.png',
  },
}

// viewportFit:'cover' lets the app use the full screen on notch / Dynamic Island
// devices; safe-area padding (app/globals.css) keeps content clear of the home
// indicator. themeColor here replaces the hand-written <meta> tags below.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f6f3' },
    { media: '(prefers-color-scheme: dark)', color: '#17181b' },
  ],
}

// Site-wide structured data: Organization + WebSite (enables sitelinks search box)
const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESC,
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

// Escape `<` so a value ending up in the JSON-LD can never break out of the
// <script> tag (matches the safeJson helper in app/[slug]/page.tsx). The inputs
// here are constants today, but this keeps it safe if they ever become dynamic.
function safeJson(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c')
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: resolve the theme before first paint. Default = light. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
  var m = localStorage.getItem('theme-mode') || 'light';
  var dark = m==='dark'
    || (m==='system' && matchMedia('(prefers-color-scheme: dark)').matches)
    || (m==='time' && (function(){var h=new Date().getHours();return h>=18||h<6;})());
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}catch(e){ document.documentElement.dataset.theme='light'; }})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJson(siteJsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-black focus:font-semibold focus:shadow-lg"
        >
          Skip to content
        </a>
        <Providers>
          <PageFade>
            <div id="main-content" tabIndex={-1} className="flex-1">{children}</div>
          </PageFade>
        </Providers>
        <GoogleAnalytics />
        <CookieConsent />
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  )
}
