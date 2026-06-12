'use client'

import { useEffect, useState } from 'react'

export type GaSettings = { enabled: boolean; id: string }

// Module-level cache so GoogleAnalytics + CookieConsent share a single fetch.
let cached: GaSettings | null = null
let inflight: Promise<GaSettings> | null = null

function load(): Promise<GaSettings> {
  if (cached) return Promise.resolve(cached)
  if (!inflight) {
    inflight = fetch('/api/ga-settings')
      .then((r) => r.json() as Promise<GaSettings>)
      .then((d) => { cached = d; return d })
      .catch(() => ({ enabled: false, id: '' }))
  }
  return inflight
}

export function useGaSettings(): GaSettings | null {
  const [settings, setSettings] = useState<GaSettings | null>(cached)
  useEffect(() => { load().then(setSettings) }, [])
  return settings
}

/** True only when GA is configured (Measurement ID set) and turned on. */
export function gaActive(s: GaSettings | null): boolean {
  return !!(s?.enabled && s.id)
}
