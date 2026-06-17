import { cache } from 'react'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatBatteries } from '@/lib/battery'
import type { FlashlightImage } from '@/lib/types'
import { ExternalLink, Video, FileText } from 'lucide-react'
import { brandSlug } from '@/lib/brand'
import { SITE_URL as BASE, OG_IMAGE } from '@/lib/seo'
import ImageGallery from './ImageGallery'
import WishlistButtons from './WishlistButtons'
import ManualSection from '@/components/ManualSection'
import MarkdownContent from '@/components/MarkdownContent'
import SuggestEditButton from '@/components/SuggestEditButton'
import SuggestDeleteButton from '@/components/SuggestDeleteButton'
import ChangeLog, { type ChangeEvent } from '@/components/ChangeLog'
import Header from '@/components/Header'

// Pre-render all flashlight pages at build time
// Cache forever - cleared on-demand when admin approves a submission
export const revalidate = false

// Deduplicate DB query between generateMetadata and page component
const getFlashlight = cache(async (slug: string) => {
  // Explicit columns the detail page + its children actually render (the spec
  // table, gallery, manuals, reviews, attribution + formatBatteries). Drops the
  // dead `notes` field and unused legacy/browse-only columns (buy_url,
  // has_usb_charging, emitter, battery_types, sort_seed) that `select('*')` pulled.
  // Single string literal (not concatenated) so Supabase can infer the column
  // types - which also makes tsc flag any field the page reads but didn't select.
  const { data } = await supabase
    .from('flashlights')
    .select('id,slug,brand,model,year,price_usd,max_lumens,min_lumens,beam_distance_m,candela,beam_type,emitters,led_count,driver_type,battery_type,battery_count,battery_options,charging_type,length_mm,head_diameter_mm,body_diameter_mm,weight_g,material,ip_rating,impact_resistance_m,category,image_url,description,manual_url,manual_urls,is_discontinued,created_at,updated_at,updated_by, reviews(*), flashlight_images(*)')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()
  return data
})

export async function generateStaticParams() {
  const { data } = await supabase.from('flashlights').select('slug').is('deleted_at', null)
  return (data ?? []).map(f => ({ slug: f.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const f = await getFlashlight(slug)
  if (!f) return { title: 'Flashlight' }

  const title = `${f.brand} ${f.model}`
  const ogTitle = `${f.brand} ${f.model} - torch.EDC.wiki`

  // Build a short spec summary for description
  const parts: string[] = []
  if (f.max_lumens)      parts.push(`${f.max_lumens.toLocaleString()} lumens`)
  if (f.beam_distance_m) parts.push(`${f.beam_distance_m}m throw`)
  if (f.battery_type)    parts.push(`${f.battery_type} battery`)
  if (f.category)        parts.push(f.category)

  const description = f.description
    ? f.description.slice(0, 155)
    : `${f.brand} ${f.model}${parts.length ? ' - ' + parts.join(', ') : ''}. Full specs, reviews and images on torch.EDC.wiki.`

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description,
      url: `${BASE}/${slug}`,
      siteName: 'torch.EDC.wiki',
      images: f.image_url ? [{ url: f.image_url, alt: `${f.brand} ${f.model}` }] : [OG_IMAGE],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: f.image_url ? [f.image_url] : [OG_IMAGE],
    },
    alternates: { canonical: `${BASE}/${slug}` },
  }
}

export default async function FlashlightPage({ params }: Props) {
  const { slug } = await params
  // Change history only needs the slug, so fire it in parallel with the row fetch.
  const clPromise = supabase.rpc('flashlight_change_log', { p_slug: slug })
  const flashlight = await getFlashlight(slug)

  if (!flashlight) notFound()

  // Brand metadata + submitter profile are independent of each other - run together.
  const [{ data: brandInfo }, profileRes] = await Promise.all([
    supabase.from('brands').select('country, made_in').eq('name', flashlight.brand).maybeSingle(),
    flashlight.updated_by
      ? supabase.from('profiles').select('nickname').eq('id', flashlight.updated_by).single()
      : Promise.resolve({ data: null }),
  ])

  // Determine attribution:
  // updated_by set + updated_at == created_at → user submitted this as new
  // updated_by set + updated_at != created_at → user edited an existing one
  const addedByUser = !!flashlight.updated_by && flashlight.updated_at === flashlight.created_at
  const updatedByNickname = (profileRes.data as { nickname: string | null } | null)?.nickname ?? null

  // Full public change history (every approved create/edit for this flashlight).
  const { data: clRows } = await clPromise
  const changeEvents = (clRows ?? []) as ChangeEvent[]
  // System-seeded lights have no submission row → add a base "Added" entry so the
  // history always shows where the record came from.
  if (!changeEvents.some(e => e.kind === 'flashlight_create')) {
    changeEvents.push({
      ts: flashlight.created_at,
      nickname: addedByUser ? updatedByNickname : null,
      kind: 'flashlight_create',
    })
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
    { label: 'Beam Intensity', value: flashlight.candela ? `${flashlight.candela.toLocaleString()} cd` : null },
    { label: 'Beam Type', value: flashlight.beam_type },
    { label: 'LED / Emitter', value: flashlight.emitters?.length ? flashlight.emitters.join(' + ') : null },
    { label: 'Number of LEDs', value: flashlight.led_count ?? null },
    { label: 'Driver', value: flashlight.driver_type },
    { label: 'Battery', value: formatBatteries(flashlight) },
    { label: 'Charging', value: flashlight.charging_type === 'usb' ? 'USB' : flashlight.charging_type === 'magnetic' ? 'Magnetic' : flashlight.charging_type === 'none' ? 'None' : null },
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

  // Escape < to prevent </script> injection in JSON-LD blocks
  const safeJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c')

  return (
    <div className="min-h-screen">
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(breadcrumbLd) }}
      />

      <div className="max-w-[1280px] mx-auto px-7 py-8">

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
                <Link href={`/brand/${brandSlug(flashlight.brand)}`} className="text-[14px] text-ink-2 mb-0.5 inline-block hover:text-brand-600 transition-colors">{flashlight.brand}</Link>
                <h1 className="text-[32px] font-bold text-ink tracking-[-0.025em] leading-[1.05]">{flashlight.model}</h1>
              </div>
              {flashlight.is_discontinued && (
                <span className="text-[11px] font-medium text-ink-3 border border-line rounded px-2 py-0.5 shrink-0 mt-1">
                  Discontinued
                </span>
              )}
            </div>

            {/* Category */}
            {flashlight.category && (
              <span className="inline-block mt-3 text-[13px] font-medium text-ink-3">
                {flashlight.category} flashlight
              </span>
            )}

            {/* Price */}
            {flashlight.price_usd && (
              <div className="mt-5 font-mono text-[28px] font-semibold text-ink">
                ${flashlight.price_usd.toLocaleString()}
              </div>
            )}

            <WishlistButtons flashlightId={flashlight.id} />

            <div className="mt-4 flex items-center gap-4 flex-wrap">
              <SuggestEditButton flashlightId={flashlight.id} />
              <SuggestDeleteButton flashlightId={flashlight.id} brand={flashlight.brand} model={flashlight.model} slug={flashlight.slug} />
            </div>
          </div>
        </div>

        {/* Description - boxed so text doesn't stretch full width */}
        {flashlight.description && (
          <div className="mt-10 bg-panel border border-line rounded-2xl p-6 sm:p-7 max-w-[760px]">
            <MarkdownContent className="text-[15px] leading-[1.7] text-ink-2">{flashlight.description}</MarkdownContent>
          </div>
        )}

        {/* Specifications - two-column grid of hairline rows, fills the width */}
        <div className="mt-10 border-t border-line">
          <h2 className="text-[13px] font-semibold text-ink py-3.5">Specifications</h2>
          <div className="grid sm:grid-cols-2 gap-x-14">
            {specs.map(s => (
              <div key={s.label} className="flex items-baseline justify-between gap-6 py-2.5 border-t border-line">
                <span className="text-[14px] text-ink-2 shrink-0">{s.label}</span>
                <span className="text-[13px] text-ink font-mono text-right">{s.value as string}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User manual */}
        <ManualSection
          slug={flashlight.slug}
          urls={Array.from(new Set([
            ...(flashlight.manual_urls ?? []),
            ...(flashlight.manual_url ? [flashlight.manual_url] : []),
          ]))}
        />

        {/* Reviews - below the manual; newest first */}
        {flashlight.reviews && flashlight.reviews.length > 0 && (
          <div className="mt-8 border-t border-line">
            <h2 className="text-[13px] font-semibold text-ink py-4">Reviews</h2>
            <div className="space-y-0">
              {[...flashlight.reviews]
                .sort((a: { published_at: string | null }, b: { published_at: string | null }) =>
                  (b.published_at ? new Date(b.published_at).getTime() : 0) -
                  (a.published_at ? new Date(a.published_at).getTime() : 0))
                .map((r: { id: string; type: string | null; title: string; url: string; published_at: string | null }) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 py-3 border-t border-line hover:text-brand-600 group"
                >
                  <div className="text-slate-300 group-hover:text-brand-500 shrink-0">
                    {r.type === 'video' ? <Video size={14} /> : <FileText size={14} />}
                  </div>
                  <p className="flex-1 min-w-0 text-sm font-medium text-ink group-hover:text-brand-700 truncate">{r.title}</p>
                  {r.published_at && (
                    <span className="text-xs text-ink-3 font-mono shrink-0">
                      {new Date(r.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  <ExternalLink size={11} className="text-slate-300 group-hover:text-brand-400 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Change history - full public record of every create/edit */}
        <div className="mt-8 pt-4 border-t border-line">
          <p className="text-[12px] font-semibold text-ink-2 mb-2">Change history</p>
          <ChangeLog events={changeEvents} context="flashlight" />
        </div>

      </div>
    </div>
  )
}
