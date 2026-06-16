import type { Metadata } from 'next'
import { SITE_URL, OG_IMAGE } from '@/lib/seo'
import { supabase } from '@/lib/supabase'
import { Flashlight } from '@/lib/types'
import Header from '@/components/Header'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Top lists',
  description: 'Curated flashlight rankings on torch.EDC.wiki - recently added, newest releases, most expensive and best value lights.',
  alternates: { canonical: `${SITE_URL}/top` },
  openGraph: {
    title: 'Top lists - torch.EDC.wiki',
    description: 'Curated flashlight rankings - recently added, newest releases, most expensive and best value lights.',
    url: `${SITE_URL}/top`,
    siteName: 'torch.EDC.wiki',
    type: 'website',
    images: [OG_IMAGE],
  },
}

export const revalidate = 3600

type TopList = {
  title: string
  subtitle: string
  items: Flashlight[]
  stat: (f: Flashlight) => string | null
  statLabel: string
}

async function fetchLists(): Promise<TopList[]> {
  const [recentlyAdded, newestRelease, mostExpensive, cheapest] = await Promise.all([
    supabase
      .from('flashlights')
      .select('id,brand,model,slug,price_usd,max_lumens,year,image_url,created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('flashlights')
      .select('id,brand,model,slug,price_usd,max_lumens,year,image_url,created_at')
      .is('deleted_at', null)
      .not('year', 'is', null)
      .order('year', { ascending: false })
      .limit(10),
    supabase
      .from('flashlights')
      .select('id,brand,model,slug,price_usd,max_lumens,year,image_url,created_at')
      .is('deleted_at', null)
      .not('price_usd', 'is', null)
      .order('price_usd', { ascending: false })
      .limit(10),
    supabase
      .from('flashlights')
      .select('id,brand,model,slug,price_usd,max_lumens,year,image_url,created_at')
      .is('deleted_at', null)
      .not('price_usd', 'is', null)
      .gt('price_usd', 0)
      .order('price_usd', { ascending: true })
      .limit(10),
  ])

  return [
    {
      title: 'Recently Added',
      subtitle: 'Latest entries in the database',
      items: (recentlyAdded.data ?? []) as Flashlight[],
      stat: f => f.max_lumens ? `${f.max_lumens.toLocaleString()} lm` : null,
      statLabel: 'lumens',
    },
    {
      title: 'Newest Release',
      subtitle: 'Most recently released models',
      items: (newestRelease.data ?? []) as Flashlight[],
      stat: f => f.year ? String(f.year) : null,
      statLabel: 'year',
    },
    {
      title: 'Most Expensive',
      subtitle: 'Highest priced flashlights',
      items: (mostExpensive.data ?? []) as Flashlight[],
      stat: f => f.price_usd != null ? `$${f.price_usd.toLocaleString()}` : null,
      statLabel: 'price',
    },
    {
      title: 'Best Value',
      subtitle: 'Most affordable flashlights',
      items: (cheapest.data ?? []) as Flashlight[],
      stat: f => f.price_usd != null ? `$${f.price_usd.toLocaleString()}` : null,
      statLabel: 'price',
    },
  ]
}

export default async function TopPage() {
  const lists = await fetchLists()

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-[1280px] mx-auto px-7 py-8">

        <div className="text-center mb-10">
          <h1 className="text-[28px] font-bold text-ink tracking-[-0.02em]">Top lists</h1>
          <p className="mt-2 text-[13px] text-ink-2">Curated flashlight rankings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {lists.map(list => (
            <div key={list.title} className="bg-panel rounded-xl border border-line overflow-hidden">
              <div className="px-5 py-4 border-b border-line">
                <h2 className="font-semibold text-ink">{list.title}</h2>
                <p className="text-xs text-ink-3 mt-0.5">{list.subtitle}</p>
              </div>

              <ol className="divide-y divide-line">
                {list.items.map((f, i) => {
                  const stat = list.stat(f)
                  return (
                    <li key={f.id}>
                      <Link
                        href={`/${f.slug}`}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/5 transition-colors group"
                      >
                        {/* Rank */}
                        <span className={`
                          shrink-0 w-6 text-center text-sm font-bold
                          ${i === 0 ? 'text-brand-500' : i === 1 ? 'text-ink-3' : i === 2 ? 'text-amber-700' : 'text-slate-300'}
                        `}>
                          {i + 1}
                        </span>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink group-hover:text-ink truncate">
                            {f.brand} {f.model}
                          </p>
                        </div>

                        {/* Stat */}
                        {stat && (
                          <span className="shrink-0 text-xs font-medium text-ink-3 bg-slate-100 dark:bg-white/[0.05] px-2 py-0.5 rounded">
                            {stat}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}

                {list.items.length === 0 && (
                  <li className="px-5 py-8 text-sm text-ink-3 text-center">No data yet.</li>
                )}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
