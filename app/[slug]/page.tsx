import { cache } from 'react'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { cdnUrl } from '@/lib/cdn'
import { formatBatteries } from '@/lib/battery'
import type { FlashlightImage } from '@/lib/types'
import { ExternalLink, Video, FileText, ChevronLeft } from 'lucide-react'
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
  if (!f) return { title: 'Flashlight — torch.EDC.wiki' }

  const title = `${f.brand} ${f.model} — torch.EDC.wiki`

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
      title,
      description,
      url: `${BASE}/${slug}`,
      siteName: 'torch.EDC.wiki',
      images: f.image_url ? [{ url: f.image_url, alt: `${f.brand} ${f.model}` }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: f.image_url ? [f.image_url] : [],
    },
    alternates: { canonical: `${BASE}/${slug}` },
  }
}

export default async function FlashlightPage({ params }: Props) {
  const { slug } = await params
  const flashlight = await getFlashlight(slug)

  if (!flashlight) notFound()

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

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6">
          <ChevronLeft size={14} /> Back to browse
        </Link>

        <div className="grid md:grid-cols-2 gap-10">
          <ImageGallery
            primaryUrl={flashlight.image_url}
            extraImages={(flashlight.flashlight_images ?? [] as FlashlightImage[]).sort((a: FlashlightImage, b: FlashlightImage) => a.sort_order - b.sort_order)}
            alt={`${flashlight.brand} ${flashlight.model}`}
          />

          <div>
            {/* Category */}
            {flashlight.category && (
              <div className="mb-2">
                <span className="inline-block bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded font-medium">
                  {flashlight.category}
                </span>
              </div>
            )}

            {/* Brand + Model */}
            <div className="flex items-start justify-between gap-3 mb-1">
              <div>
                <p className="text-slate-400 text-sm">{flashlight.brand}</p>
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">{flashlight.model}</h1>
              </div>
              {flashlight.is_discontinued && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 border border-[#e7e7e1] rounded px-2 py-0.5 shrink-0 mt-1">
                  Discontinued
                </span>
              )}
            </div>

            {/* Price */}
            {flashlight.price_usd && (
              <div className="mt-4 text-xl font-mono font-bold text-slate-900">${flashlight.price_usd.toLocaleString()}</div>
            )}

            <WishlistButtons flashlightId={flashlight.id} />

            <div className="mt-4">
              <SuggestEditButton flashlightId={flashlight.id} />
            </div>
          </div>
        </div>

        {/* Description */}
        {flashlight.description && (
          <div className="mt-8 pt-6 border-t border-[#e7e7e1] text-sm text-slate-600 leading-relaxed">
            <MarkdownContent>{flashlight.description}</MarkdownContent>
          </div>
        )}

        {/* Specifications — flat table, no zebra, no outer card */}
        <div className="mt-8 border-t border-[#e7e7e1]">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 py-3">Specifications</h2>
          <table className="w-full">
            <tbody>
              {specs.map(s => (
                <tr key={s.label} className="border-t border-[#e7e7e1]">
                  <td className="py-2.5 pr-6 text-xs text-slate-400 w-44">{s.label}</td>
                  <td className="py-2.5 text-sm text-slate-900 font-mono">{s.value as string}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Reviews */}
        {flashlight.reviews && flashlight.reviews.length > 0 && (
          <div className="mt-8 border-t border-[#e7e7e1]">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 py-3">Reviews</h2>
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
