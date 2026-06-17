import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { brandSlug } from '@/lib/brand'
import Header from '@/components/Header'

// Page size for the data-log feed. Page 1 lives at /data-log, older pages at
// /data-log/[page] - paginating via a path param (not searchParams) keeps the
// route statically ISR-cacheable instead of forcing per-request dynamic rendering.
export const PAGE_SIZE = 500

type LogRow = {
  ts: string
  nickname: string | null
  kind: 'flashlight_create' | 'flashlight_edit' | 'brand_create' | 'brand_edit'
  brand: string | null
  model: string | null
  slug: string | null
}

// Format the timestamp in GMT+7 (Vietnam / Asia-Bangkok, no DST).
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

// Page n>1 lives at /data-log/n; page 1 is the bare /data-log.
const pageHref = (n: number) => (n <= 1 ? '/data-log' : `/data-log/${n}`)

export default async function DataLogView({ page }: { page: number }) {
  const offset = (page - 1) * PAGE_SIZE

  const [{ data: rows }, { data: total }] = await Promise.all([
    supabase.rpc('data_change_log', { p_limit: PAGE_SIZE, p_offset: offset }),
    supabase.rpc('data_change_log_count'),
  ])

  const events = (rows ?? []) as LogRow[]
  const count = (total ?? 0) as number
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-3xl mx-auto px-6 py-10 sm:py-14">
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-[-0.02em]">Database updates</h1>
          <p className="mt-3 text-ink-3 text-[15px] leading-relaxed max-w-2xl mx-auto">
            Every change made to the catalog by the community - flashlights and brands
            added or edited. Times are GMT+7. ({count.toLocaleString()} total)
          </p>
        </div>

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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 text-sm">
            {page > 1
              ? <Link href={pageHref(page - 1)} className="text-brand-600 font-medium hover:text-brand-500">← Newer</Link>
              : <span className="text-ink-3/40">← Newer</span>}
            <span className="text-ink-3 text-xs">Page {page} of {totalPages}</span>
            {page < totalPages
              ? <Link href={pageHref(page + 1)} className="text-brand-600 font-medium hover:text-brand-500">Older →</Link>
              : <span className="text-ink-3/40">Older →</span>}
          </div>
        )}
      </div>
    </div>
  )
}
