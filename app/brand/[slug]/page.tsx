import { cache } from 'react'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { Globe, MapPin, Calendar, Factory } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { brandSlug } from '@/lib/brand'
import { SITE_URL as BASE, OG_IMAGE } from '@/lib/seo'
import type { Flashlight, Brand } from '@/lib/types'
import Header from '@/components/Header'
import MarkdownContent from '@/components/MarkdownContent'
import BrandEditButton from '@/components/BrandEditButton'
import BrandFlashlights from './BrandFlashlights'

// Pre-render brand pages at build; cleared on-demand like flashlight pages.
export const revalidate = false

const getDistinctBrands = cache(async (): Promise<string[]> => {
  const { data } = await supabase.rpc('get_distinct_brands')
  return ((data ?? []) as { brand: string }[]).map(r => r.brand).filter(Boolean)
})

const resolveBrand = cache(async (slug: string) => {
  const names = await getDistinctBrands()
  const name = names.find(b => brandSlug(b) === slug)
  if (!name) return null

  const [{ data: info }, { data: lights }] = await Promise.all([
    supabase.from('brands').select('*').eq('name', name).maybeSingle(),
    supabase
      .from('flashlights')
      .select('*')
      .eq('brand', name)
      .order('year', { ascending: false, nullsFirst: false })
      .order('model', { ascending: true }),
  ])

  return { name, info: (info ?? null) as Brand | null, lights: (lights ?? []) as Flashlight[] }
})

export async function generateStaticParams() {
  const names = await getDistinctBrands()
  return names.map(b => ({ slug: brandSlug(b) }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const brand = await resolveBrand(slug)
  if (!brand) return { title: 'Brand' }

  const title = `${brand.name} flashlights`
  const ogTitle = `${brand.name} flashlights — torch.EDC.wiki`
  const description = brand.info?.about
    ? brand.info.about.replace(/[#*_>`]/g, '').slice(0, 155)
    : `All ${brand.name} flashlights on torch.EDC.wiki — ${brand.lights.length} models with full specs, organized by release year.`

  return {
    title,
    description,
    openGraph: { title: ogTitle, description, url: `${BASE}/brand/${slug}`, siteName: 'torch.EDC.wiki', type: 'website', images: [OG_IMAGE] },
    alternates: { canonical: `${BASE}/brand/${slug}` },
  }
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params
  const brand = await resolveBrand(slug)
  if (!brand) notFound()

  const { name, info, lights } = brand

  const meta = [
    info?.founded_year ? { icon: Calendar, label: `Founded ${info.founded_year}` } : null,
    info?.headquarters ? { icon: MapPin, label: info.headquarters } : null,
    info?.made_in ? { icon: Factory, label: `Made in ${info.made_in}` } : null,
  ].filter(Boolean) as { icon: typeof Calendar; label: string }[]

  // Attribution — same logic as flashlight pages: updated_by set + timestamps
  // equal → added by that user; differ → also edited by them; null → system.
  const addedByUser  = !!info?.updated_by && info?.updated_at === info?.created_at
  const editedByUser = !!info?.updated_by && info?.updated_at !== info?.created_at
  let updatedByNickname: string | null = null
  if (info?.updated_by) {
    const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', info.updated_by).single()
    updatedByNickname = profile?.nickname ?? null
  }
  const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null

  // Structured data: Brand entity + breadcrumb trail
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Brand',
        '@id': `${BASE}/brand/${slug}#brand`,
        name,
        url: `${BASE}/brand/${slug}`,
        ...(info?.logo_url ? { logo: info.logo_url } : {}),
        ...(info?.founded_year ? { foundingDate: String(info.founded_year) } : {}),
        ...(info?.about ? { description: info.about.replace(/[#*_>`]/g, '').slice(0, 300) } : {}),
        ...(info?.website ? { sameAs: [info.website] } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Flashlights', item: BASE },
          { '@type': 'ListItem', position: 2, name: 'Brands', item: `${BASE}/brands` },
          { '@type': 'ListItem', position: 3, name, item: `${BASE}/brand/${slug}` },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen">
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="max-w-[1280px] mx-auto px-7 py-8">

        {/* Brand hero */}
        <div className="max-w-[760px]">
          <p className="text-[13px] font-medium text-[#9b9b94] mb-1">
            {info?.country ? `${info.country} · ` : ''}Flashlight maker
          </p>
          <h1 className="text-[34px] font-bold text-[#17171a] tracking-[-0.025em] leading-[1.05]">{name}</h1>

          {(meta.length > 0 || info?.website) && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-[13px] text-[#6c6c66]">
              {meta.map((m, i) => (
                <span key={i} className="inline-flex items-center gap-1.5">
                  <m.icon size={14} className="text-[#9b9b94]" /> {m.label}
                </span>
              ))}
              {info?.website && (
                <a href={info.website} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-brand-600 hover:underline">
                  <Globe size={14} /> Website
                </a>
              )}
            </div>
          )}

          {info?.about && (
            <div className="mt-5 bg-white border border-[#e7e7e1] rounded-2xl p-6 sm:p-7">
              <MarkdownContent className="text-[15px] leading-[1.7] text-[#6c6c66]">{info.about}</MarkdownContent>
            </div>
          )}

          <div className="mt-5 flex items-center gap-4">
            <p className="text-[13px] text-[#6c6c66]">
              <b className="text-[#17171a] font-semibold">{lights.length}</b> model{lights.length !== 1 ? 's' : ''} in the database
            </p>
            <span className="text-[#d3d3cb]">·</span>
            <BrandEditButton name={name} initial={info} />
          </div>
        </div>

        {/* Flashlights by year */}
        <div className="mt-10 pt-8 border-t border-[#e7e7e1]">
          {lights.length === 0 ? (
            <p className="text-[#9b9b94] text-sm">No flashlights yet.</p>
          ) : (
            <BrandFlashlights items={lights} />
          )}
        </div>

        {/* Attribution timeline */}
        {(info?.created_at || info?.updated_by) && (
          <div className="mt-8 pt-4 border-t border-[#e7e7e1] space-y-1 text-xs text-slate-400">
            {editedByUser && (
              <div className="flex items-center gap-2">
                <span className="text-slate-300">–</span>
                <span>
                  Updated by{' '}
                  {updatedByNickname
                    ? <Link href={`/u/${updatedByNickname}`} className="text-slate-500 font-medium hover:text-slate-700">{updatedByNickname}</Link>
                    : 'user'}
                  {info?.updated_at ? `${' · '}${fmtDate(info.updated_at)}` : ''}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-slate-300">–</span>
              <span>
                Added by{' '}
                {addedByUser && updatedByNickname
                  ? <Link href={`/u/${updatedByNickname}`} className="text-slate-500 font-medium hover:text-slate-700">{updatedByNickname}</Link>
                  : 'system'}
                {info?.created_at ? `${' · '}${fmtDate(info.created_at)}` : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
