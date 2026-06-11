'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { useAuth } from '@/lib/auth-context'
import { useConsent } from '@/lib/use-consent'

type GASettings = { enabled: boolean; id: string }

export default function GoogleAnalytics() {
  const { isAdmin } = useAuth()
  const consent = useConsent()
  const [settings, setSettings] = useState<GASettings | null>(null)

  useEffect(() => {
    fetch('/api/ga-settings')
      .then(r => r.json())
      .then((data: GASettings) => setSettings(data))
      .catch(() => {})
  }, [])

  // Never track admin users
  if (isAdmin) return null
  // Require explicit cookie consent before loading GA (sets the _ga cookie)
  if (consent !== 'accepted') return null
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
