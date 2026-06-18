'use client'

import { useState } from 'react'
import Link from 'next/link'

export type ChangeEvent = {
  ts: string
  nickname: string | null
  kind: 'flashlight_create' | 'flashlight_edit' | 'brand_create' | 'brand_edit'
  model?: string | null
  slug?: string | null
  is_staff?: boolean
}

// GMT+7 (Asia/Bangkok, no DST) - matches the /log Database tab.
const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Bangkok',
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: false,
})

function verb(kind: ChangeEvent['kind']) {
  switch (kind) {
    case 'flashlight_create': return 'added'
    case 'flashlight_edit':   return 'edited'
    case 'brand_create':      return 'created brand'
    case 'brand_edit':        return 'updated brand'
  }
}

const VISIBLE = 5

// Public create/edit history for a flashlight or a brand. Newest first, collapses
// to the first 5 with a "See more" toggle. `context` controls whether each row
// links to a flashlight (brand page) or is plain (flashlight page).
export default function ChangeLog({ events, context }: { events: ChangeEvent[]; context: 'flashlight' | 'brand' }) {
  const [expanded, setExpanded] = useState(false)
  if (events.length === 0) return null
  const shown = expanded ? events : events.slice(0, VISIBLE)

  return (
    <div className="space-y-1 text-xs text-ink-3">
      {shown.map((e, i) => {
        // Staff (admin/mod) contributors render in amber; regular users in
        // strong dark gray so the two are visually distinct at a glance.
        const who = e.nickname
          ? <Link
              href={`/u/${e.nickname}`}
              className={e.is_staff
                ? 'text-brand-600 font-medium hover:text-brand-500'
                : 'text-ink-2 font-semibold hover:text-ink'}
            >{e.nickname}</Link>
          : <span className="text-ink-2">system</span>
        const showModel = context === 'brand' && (e.kind === 'flashlight_create' || e.kind === 'flashlight_edit')
        return (
          <div key={i} className="flex items-baseline gap-2">
            <span className="text-slate-300 shrink-0">–</span>
            <span className="leading-relaxed">
              {who} {verb(e.kind)}
              {showModel && ' '}
              {showModel && (e.slug
                ? <Link href={`/${e.slug}`} className="text-ink font-medium hover:text-brand-600">{e.model}</Link>
                : <span className="text-ink font-medium">{e.model}</span>
              )}
              {' · '}
              <time dateTime={e.ts} className="font-mono">{fmt.format(new Date(e.ts))}</time>
            </span>
          </div>
        )
      })}

      {events.length > VISIBLE && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="ml-4 mt-1 text-[12px] text-brand-600 font-medium hover:text-brand-500"
        >
          {expanded ? 'See less' : `See more (${events.length - VISIBLE})`}
        </button>
      )}
    </div>
  )
}
