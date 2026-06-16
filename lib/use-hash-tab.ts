'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Sync an in-page tab to the URL hash (e.g. `/account#security`) so tabs become
 * deep-linkable, shareable and the browser back button moves between them.
 *
 * `valid` is the list of allowed keys (pass a stable, module-level array).
 * The hash is only adopted when it matches a valid key, so junk hashes fall back.
 */
export function useHashTab<T extends string>(valid: readonly T[], fallback: T): [T, (t: T) => void] {
  const [tab, setTabState] = useState<T>(fallback)

  useEffect(() => {
    const apply = () => {
      const h = window.location.hash.slice(1)
      if ((valid as readonly string[]).includes(h)) setTabState(h as T)
    }
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
    // `valid` is a static literal from the caller; only run on mount + subscribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setTab = useCallback((t: T) => {
    setTabState(t)
    if (typeof window !== 'undefined') history.replaceState(null, '', `#${t}`)
  }, [])

  return [tab, setTab]
}
