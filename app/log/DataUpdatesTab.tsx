'use client'
import Link from 'next/link'
import { brandSlug } from '@/lib/brand'

// Community data-change feed, rendered as the "Database" tab of /log (folded in
// from the old standalone /data-log page). Rows are fetched server-side in page.tsx
// and passed in already serialised. The list is short enough (~100s) to show in full.
export type LogRow = {
  ts: string
  nickname: string | null
  kind: 'flashlight_create' | 'flashlight_edit' | 'brand_create' | 'brand_edit'
  brand: string | null
  model: string | null
  slug: string | null
}

// GMT+7 (Vietnam / Asia-Bangkok, no DST) - matches ChangeLog.
const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Bangkok',
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hour12: false,
})

function verb(kind: LogRow['kind']) {
  switch (kind) {
    case 'flashlight_create': return 'added'
    case 'flashlight_edit':   return 'edited'
    case 'brand_create':      return 'created brand'
    case 'brand_edit':        return 'updated brand'
  }
}

export default function DataUpdatesTab({ events, count }: { events: LogRow[]; count: number }) {
  return (
    <section className="max-w-3xl mx-auto">
      <p className="text-center text-ink-3 text-[13px] leading-relaxed mb-6">
        Every change made to the catalog by the community - flashlights and brands
        added or edited. Times are GMT+7. ({count.toLocaleString()} total)
      </p>

      {events.length === 0 ? (
        <p className="text-ink-3 text-sm py-16 text-center">No updates yet.</p>
      ) : (
        <div className="bg-panel border border-line rounded-2xl divide-y divide-line">
          {events.map((e, i) => {
            const who = e.nickname
              ? <Link href={`/u/${e.nickname}`} className="text-brand-600 font-medium hover:text-brand-500">{e.nickname}</Link>
              : <span className="text-ink-2 font-medium">A member</span>
            const isBrand = e.kind === 'brand_create' || e.kind === 'brand_edit'
            const name = `${e.brand ?? ''} ${e.model ?? ''}`.trim() || 'an entry'
            return (
              <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-x-3 px-5 py-3.5">
                <time className="text-[12px] text-ink-3 font-mono shrink-0 sm:w-44" dateTime={e.ts}>
                  {fmt.format(new Date(e.ts))}
                </time>
                <p className="text-[13px] text-ink-2 leading-relaxed">
                  {who} {verb(e.kind)}{' '}
                  {isBrand ? (
                    e.brand
                      ? <Link href={`/brand/${brandSlug(e.brand)}`} className="text-ink font-medium hover:text-brand-600">{e.brand}</Link>
                      : <span className="text-ink font-medium">a brand</span>
                  ) : e.slug ? (
                    <Link href={`/${e.slug}`} className="text-ink font-medium hover:text-brand-600">{name}</Link>
                  ) : (
                    <span className="text-ink font-medium">{name}</span>
                  )}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
