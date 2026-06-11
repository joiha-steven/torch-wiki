import { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { brandSlug } from '@/lib/brand'
import type { Brand } from '@/lib/types'
import Header from '@/components/Header'

export const revalidate = false

const BASE = 'https://torch.edc.wiki'

export const metadata: Metadata = {
  title: 'Brands & makers — torch.EDC.wiki',
  description: 'Every flashlight brand and custom maker in the torch.EDC.wiki database, with model counts and company info.',
  alternates: { canonical: `${BASE}/brands` },
}

export default async function BrandsPage() {
  const [{ data: rows }, { data: meta }] = await Promise.all([
    supabase.from('flashlights').select('brand'),
    supabase.from('brands').select('*'),
  ])

  // Tally models per brand
  const counts = new Map<string, number>()
  for (const r of (rows ?? []) as { brand: string }[]) {
    if (r.brand) counts.set(r.brand, (counts.get(r.brand) ?? 0) + 1)
  }
  const metaByName = new Map((meta ?? []).map((b: Brand) => [b.name, b]))

  const brands = [...counts.entries()]
    .map(([name, count]) => ({ name, count, info: metaByName.get(name) ?? null }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-[1360px] mx-auto px-7 py-8">

        <div className="text-center mb-10">
          <h1 className="text-[28px] font-bold text-[#17171a] tracking-[-0.02em]">Brands &amp; makers</h1>
          <p className="mt-2 text-[13px] text-[#6c6c66]">
            <b className="text-[#17171a] font-semibold">{brands.length}</b> brands · <b className="text-[#17171a] font-semibold">{rows?.length ?? 0}</b> flashlights
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {brands.map(({ name, count, info }) => (
            <Link
              key={name}
              href={`/brand/${brandSlug(name)}`}
              className="glass-card rounded-[18px] p-4 flex flex-col"
            >
              <h2 className="text-[15px] font-semibold text-[#17171a] tracking-[-0.01em] leading-snug">{name}</h2>
              <p className="mt-0.5 text-[12px] text-[#9b9b94]">
                {[info?.country, info?.founded_year ? `est. ${info.founded_year}` : null].filter(Boolean).join(' · ') || ' '}
              </p>
              <p className="mt-3 font-mono text-[12px] text-[#6c6c66]">
                {count} model{count !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
