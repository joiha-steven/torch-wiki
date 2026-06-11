import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Providers from '@/components/Providers'
import PageFade from '@/components/PageFade'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import { SITE_URL, SITE_NAME, OG_IMAGE } from '@/lib/seo'
import './globals.css'

// Inter — clean, well-hinted variable UI/display font. Apple devices still get
// San Francisco (via -apple-system in the CSS stack); Inter covers everyone else.
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
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
    statusBarStyle: 'black-translucent',
    title: 'torch.EDC',
  },
  icons: {
    icon: [
      { url: '/favicon.ico',       sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/icon-192.png',
  },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <PageFade>
            <div className="flex-1">{children}</div>
          </PageFade>
        </Providers>
        <GoogleAnalytics />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
