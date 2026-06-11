'use client'

import { useSyncExternalStore } from 'react'

// Cookie consent for non-essential cookies (Google Analytics).
// Essential cookies (Supabase auth session, Turnstile) and the cookieless
// Vercel Analytics are not gated by this.

export type Consent = 'accepted' | 'declined' | null

const KEY = 'torch-cookie-consent'
const EVENT = 'torch-consent-change'

export function getConsent(): Consent {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(KEY)
  return v === 'accepted' || v === 'declined' ? v : null
}

export function setConsent(v: 'accepted' | 'declined') {
  localStorage.setItem(KEY, v)
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}

// Live consent value — updates when the user makes a choice (same tab via the
// custom event, other tabs via the storage event) so GA can load without a reload.
export function useConsent(): Consent {
  return useSyncExternalStore(subscribe, getConsent, () => null)
}
