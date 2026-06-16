'use client'

import { useEffect } from 'react'

// Registers the hand-rolled service worker (public/sw.js) after the page loads.
// The SW makes repeat opens instant (static assets served from cache) and adds
// an offline fallback — the core of the "feels like an installed app" experience.
// Kept deliberately tiny and dependency-free; no build integration (this is a
// customized Next 16 build — see AGENTS.md).
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    // Register after load so it never competes with first-paint resources.
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* registration failure is non-fatal — the site works without the SW */
      })
    }
    if (document.readyState === 'complete') onLoad()
    else window.addEventListener('load', onLoad, { once: true })
    return () => window.removeEventListener('load', onLoad)
  }, [])

  return null
}
