'use client'

import Link from 'next/link'
import { useState, type ComponentProps } from 'react'

type Props = Omit<ComponentProps<typeof Link>, 'prefetch'>

/**
 * A Link that prefetches only once the user shows intent (hover / focus / touch),
 * instead of eagerly when it scrolls into the viewport.
 *
 * The browse grid renders 32+ of these; prefetching them all on load pulled in
 * every detail route + RSC payload and bloated first load (see the browse-perf
 * note in CLAUDE.md), so cards used `prefetch={false}` and never prefetched at
 * all. This is the middle ground from Next's prefetching guide: keep prefetch
 * off until the pointer lands on a card, then flip it to `null` (default static
 * prefetch) so the click feels instant.
 */
export default function HoverPrefetchLink({ children, onMouseEnter, onFocus, onTouchStart, ...props }: Props) {
  const [active, setActive] = useState(false)
  return (
    <Link
      {...props}
      prefetch={active ? null : false}
      onMouseEnter={(e) => { setActive(true); onMouseEnter?.(e) }}
      onFocus={(e) => { setActive(true); onFocus?.(e) }}
      onTouchStart={(e) => { setActive(true); onTouchStart?.(e) }}
    >
      {children}
    </Link>
  )
}
