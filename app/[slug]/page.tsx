import { cache } from 'react'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { cdnUrl } from '@/lib/cdn'
import { formatBatteries } from '@/lib/battery'
import type { FlashlightImage } from '@/lib/types'
import { ExternalLink, Video, FileText } from 'lucide-react'
import { brandSlug } from '@/lib/brand'
import ImageGallery from './ImageGallery'
import WishlistButtons from './WishlistButtons'
import ManualSection from '@/components/ManualSection'
import MarkdownContent from '@/components/MarkdownContent'
import SuggestEditButton from '@/components/SuggestEditButton'
import Header from '@/components/Header'

// Pre-render all flashlight pages at build time
// Cache forever — cleared on-demand when admin approves a submission
export const revalidate = false

const BASE = 'https://torch.edc.wiki'

// Deduplicate DB query between generateMetadata and page component
const getFlashlight = cache(async (slug: string) => {
  const { data } = await supabase
    .from('flashlights')
    .select('*, reviews(*), flashlight_images(*)')
    .eq('slug', slug)
    .single()
  return data
})

export async function generateStaticParams() {
  const { data } = await supabase.from('flashlights').select('slug')
  return (data ?? []).map(f => ({ slug: f.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const f = await getFlashlight(slug)
  if (!f) return { title: 'Flashlight' }

  const title = `${f.brand} ${f.model}`
  const ogTitle = `${f.brand} ${f.model} — torch.EDC.wiki`

  // Build a short spec summary for description
  const parts: string[] = []
  if (f.max_lumens)      parts.push(`${f.max_lumens.toLocaleString()} lumens`)
  if (f.beam_distance_m) parts.push(`${f.beam_distance_m}m throw`)
  if (f.battery_type)    parts.push(`${f.battery_type} battery`)
  if (f.category)        parts.push(f.category)

  const description = f.description
    ? f.description.slice(0, 155)
    : `${f.brand} ${f.model}${parts.length ? ' — ' + parts.join(', ') : ''}. Full specs, reviews and images on torch.EDC.wiki.`

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      url: `${BASE}/${slug}`,
      siteName: 'torch.EDC.wiki',
      images: f.image_url ? [{ url: f.image_url, alt: `${f.brand} ${f.model}` }] : ['/og-default.jpg'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: f.image_url ? [f.image_url] : ['/og-default.jpg'],
    },
    alternates: { canonical: `${BASE}/${slug}` },
  }
}

export default async function FlashlightPage({ params }: Props) {
  const { slug } = await params
  const flashlight = await getFlashlight(slug)

  if (!flashlight) notFound()

  // Brand-level metadata (origin + manufacturing country) — looked up by brand name
  const { data: brandInfo } = await supabase
    .from('brands')
    .select('country, made_in')
    .eq('name', flashlight.brand)
    .maybeSingle()

  // Determine attribution:
  // updated_by set + updated_at == created_at → user submitted this as new
  // updated_by set + updated_at != created_at → user edited an existing one
  const addedByUser = !!flashlight.updated_by && flashlight.updated_at === flashlight.created_at
  const editedByUser = !!flashlight.updated_by && flashlight.updated_at !== flashlight.created_at

  let updatedByNickname: string | null = null
  if (flashlight.updated_by) {
    const { data: profile } = await supabase
      .from('profiles').select('nickname').eq('id', flashlight.updated_by).single()
    updatedByNickname = profile?.nickname ?? null
  }

  const specs = [
    { label: 'Brand', value: flashlight.brand },
    { label: 'Model', value: flashlight.model },
    { label: 'Brand Origin', value: brandInfo?.country ?? null },
    { label: 'Made In', value: brandInfo?.made_in ?? null },
    { label: 'Year', value: flashlight.year },
    { label: 'Category', value: flashlight.category },
    { label: 'Max Output', value: flashlight.max_lumens ? `${flashlight.max_lumens.toLocaleString()} lm` : null },
    { label: 'Min Output', value: flashlight.min_lumens ? `${flashlight.min_lumens} lm` : null },
    { label: 'Beam Distance', value: flashlight.beam_distance_m ? `${flashlight.beam_distance_m} m` : null },
    { label: 'Beam Type', value: flashlight.beam_type },
    { label: 'LED / Emitter', value: flashlight.emitters?.length ? flashlight.emitters.join(' + ') : null },
    { label: 'Battery', value: formatBatteries(flashlight) },
    { label: 'Charging', value: flashlight.charging_type === 'usb' ? 'USB' : flashlight.charging_type === 'magnetic' ? 'Magnetic' : 'None' },
    { label: 'Length', value: flashlight.length_mm ? `${flashlight.length_mm} mm` : null },
    { label: 'Head Diameter', value: flashlight.head_diameter_mm ? `${flashlight.head_diameter_mm} mm` : null },
    { label: 'Body Diameter', value: flashlight.body_diameter_mm ? `${flashlight.body_diameter_mm} mm` : null },
    { label: 'Weight', value: flashlight.weight_g ? `${flashlight.weight_g} g` : null },
    { label: 'Material', value: flashlight.material },
    { label: 'IP Rating', value: flashlight.ip_rating },
    { label: 'Impact Resistance', value: flashlight.impact_resistance_m ? `${flashlight.impact_resistance_m} m` : null },
    { label: 'Est. Retail Price', value: flashlight.price_usd ? `$${flashlight.price_usd}` : null },
  ].filter((s) => s.value != null)

  // JSON-LD Product structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${flashlight.brand} ${flashlight.model}`,
    brand: { '@type': 'Brand', name: flashlight.brand },
    category: flashlight.category ?? undefined,
    description: flashlight.description ?? undefined,
    image: flashlight.image_url ?? undefined,
    url: `${BASE}/${slug}`,
    ...(flashlight.price_usd ? {
      offers: {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: flashlight.price_usd,
        availability: flashlight.is_discontinued
          ? 'https://schema.org/Discontinued'
          : 'https://schema.org/InStock',
      },
    } : {}),
  }

  // Breadcrumb trail: Home › {Brand} › {Model}
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Flashlights', item: BASE },
      { '@type': 'ListItem', position: 2, name: flashlight.brand, item: `${BASE}/brand/${brandSlug(flashlight.brand)}` },
      { '@type': 'ListItem', position: 3, name: flashlight.model, item: `${BASE}/${slug}` },
    ],
  }

  return (
    <div className="min-h-screen">
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="max-w-[1360px] mx-auto px-7 py-8">

        <div className="grid md:grid-cols-2 gap-14 items-start">
          <ImageGallery
            primaryUrl={flashlight.image_url}
            extraImages={(flashlight.flashlight_images ?? [] as FlashlightImage[]).sort((a: FlashlightImage, b: FlashlightImage) => a.sort_order - b.sort_order)}
            alt={`${flashlight.brand} ${flashlight.model}`}
          />

          <div>
            {/* Brand + Model */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/brand/${brandSlug(flashlight.brand)}`} className="text-[14px] text-[#6c6c66] mb-0.5 inline-block hover:text-brand-600 transition-colors">{flashlight.brand}</Link>
                <h1 className="text-[32px] font-bold text-[#17171a] tracking-[-0.025em] leading-[1.05]">{flashlight.model}</h1>
              </div>
              {flashlight.is_discontinued && (
                <span className="text-[11px] font-medium text-[#9b9b94] border border-[#e7e7e1] rounded px-2 py-0.5 shrink-0 mt-1">
                  Discontinued
                </span>
              )}
            </div>

            {/* Category */}
            {flashlight.category && (
              <span className="inline-block mt-3 text-[13px] font-medium text-[#9b9b94]">
                {flashlight.category} flashlight
              </span>
            )}

            {/* Price */}
            {flashlight.price_usd && (
              <div className="mt-5 font-mono text-[28px] font-semibold text-[#17171a]">
                ${flashlight.price_usd.toLocaleString()}
              </div>
            )}

            <WishlistButtons flashlightId={flashlight.id} />

            <div className="mt-4">
              <SuggestEditButton flashlightId={flashlight.id} />
            </div>
          </div>
        </div>

        {/* Description — boxed so text doesn't stretch full width */}
        {flashlight.description && (
          <div className="mt-10 bg-white border border-[#e7e7e1] rounded-2xl p-6 sm:p-7 max-w-[760px]">
            <MarkdownContent className="text-[15px] leading-[1.7] text-[#6c6c66]">{flashlight.description}</MarkdownContent>
          </div>
        )}

        {/* Specifications — two-column grid of hairline rows, fills the width */}
        <div className="mt-10 border-t border-[#e7e7e1]">
          <h2 className="text-[13px] font-semibold text-[#17171a] py-3.5">Specifications</h2>
          <div className="grid sm:grid-cols-2 gap-x-14">
            {specs.map(s => (
              <div key={s.label} className="flex items-baseline justify-between gap-6 py-2.5 border-t border-[#e7e7e1]">
                <span className="text-[14px] text-[#6c6c66] shrink-0">{s.label}</span>
                <span className="text-[13px] text-[#17171a] font-mono text-right">{s.value as string}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        {flashlight.reviews && flashlight.reviews.length > 0 && (
          <div className="mt-8 border-t border-[#e7e7e1]">
            <h2 className="text-[13px] font-semibold text-[#17171a] py-4">Reviews</h2>
            <div className="space-y-0">
              {flashlight.reviews.map((r: { id: string; type: string | null; title: string; reviewer: string | null; summary: string | null; url: string }) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 py-3 border-t border-[#e7e7e1] hover:text-brand-600 group"
                >
                  <div className="mt-0.5 text-slate-300 group-hover:text-brand-500 shrink-0">
                    {r.type === 'video' ? <Video size={14} /> : <FileText size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 group-hover:text-brand-700">{r.title}</p>
                    {r.reviewer && <p className="text-xs text-slate-400 mt-0.5">{r.reviewer}</p>}
                    {r.summary && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.summary}</p>}
                  </div>
                  <ExternalLink size={11} className="text-slate-300 group-hover:text-brand-400 mt-0.5 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* User manual */}
        <ManualSection
          slug={flashlight.slug}
          urls={Array.from(new Set([
            ...(flashlight.manual_urls ?? []),
            ...(flashlight.manual_url ? [flashlight.manual_url] : []),
          ]))}
        />

        {/* Timeline */}
        <div className="mt-8 pt-4 border-t border-[#e7e7e1] space-y-1 text-xs text-slate-400">
          {editedByUser && (
            <div className="flex items-center gap-2">
              <span className="text-slate-300">–</span>
              <span>
                Updated by{' '}
                {updatedByNickname
                  ? <Link href={`/u/${updatedByNickname}`} className="text-slate-500 font-medium hover:text-slate-700">{updatedByNickname}</Link>
                  : 'user'
                }
                {' · '}{new Date(flashlight.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-slate-300">–</span>
            <span>
              Added by{' '}
              {addedByUser && updatedByNickname
                ? <Link href={`/u/${updatedByNickname}`} className="text-slate-500 font-medium hover:text-slate-700">{updatedByNickname}</Link>
                : 'system'
              }
              {' · '}{new Date(flashlight.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}
