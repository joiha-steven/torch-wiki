import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Providers from '@/components/Providers'
import PageFade from '@/components/PageFade'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

const SITE_NAME = 'torch.EDC.wiki'
const SITE_DESC = 'Community reference database for flashlight collectors and enthusiasts — full specs, reviews, images and release history for hundreds of EDC, tactical, thrower and headlamp flashlights.'

export const metadata: Metadata = {
  metadataBase: new URL('https://torch.edc.wiki'),
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
    url: 'https://torch.edc.wiki',
    locale: 'en_US',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'torch.EDC.wiki — Flashlight Database' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'torch.EDC.wiki — Flashlight Database',
    description: SITE_DESC,
    images: ['/og-default.jpg'],
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
      '@id': 'https://torch.edc.wiki/#organization',
      name: SITE_NAME,
      url: 'https://torch.edc.wiki',
      logo: 'https://torch.edc.wiki/icon-512.png',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://torch.edc.wiki/#website',
      name: SITE_NAME,
      url: 'https://torch.edc.wiki',
      description: SITE_DESC,
      publisher: { '@id': 'https://torch.edc.wiki/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://torch.edc.wiki/?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
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
