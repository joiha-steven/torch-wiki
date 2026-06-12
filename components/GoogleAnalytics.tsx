'use client'

import Script from 'next/script'
import { useAuth } from '@/lib/auth-context'
import { useConsent } from '@/lib/use-consent'
import { useGaSettings } from '@/lib/use-ga-settings'

export default function GoogleAnalytics() {
  const { isAdmin } = useAuth()
  const consent = useConsent()
  const settings = useGaSettings()

  // Never track admin users
  if (isAdmin) return null
  // Require explicit cookie consent before loading GA (sets the _ga cookie)
  if (consent !== 'accepted') return null
  // No Measurement ID / GA off → nothing to load
  if (!settings?.enabled || !settings.id) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${settings.id}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${settings.id}', { send_page_view: true });
      `}</Script>
    </>
  )
}
