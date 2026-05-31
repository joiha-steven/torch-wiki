import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { FlashlightImage } from '@/lib/types'
import { Zap, Target, Battery, Weight, ExternalLink, Video, FileText, ChevronLeft, BookOpen } from 'lucide-react'
import ImageGallery from './ImageGallery'
import WishlistButtons from './WishlistButtons'
import Header from '@/components/Header'

type Props = { params: Promise<{ slug: string }> }

export default async function FlashlightPage({ params }: Props) {
  const { slug } = await params

  const { data: flashlight } = await supabase
    .from('flashlights')
    .select('*, reviews(*), flashlight_images(*)')
    .eq('slug', slug)
    .single()

  if (!flashlight) notFound()

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
    { label: 'Battery', value: flashlight.battery_type ? `${flashlight.battery_count ? `${flashlight.battery_count}× ` : ''}${flashlight.battery_type}` : null },
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

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <Header breadcrumb={`${flashlight.brand} ${flashlight.model}`} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6">
          <ChevronLeft size={14} /> Back to browse
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          <ImageGallery
            primaryUrl={flashlight.image_url}
            extraImages={(flashlight.flashlight_images ?? [] as FlashlightImage[]).sort((a: FlashlightImage, b: FlashlightImage) => a.sort_order - b.sort_order)}
            alt={`${flashlight.brand} ${flashlight.model}`}
          />

          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <p className="text-slate-500 text-sm">{flashlight.brand}</p>
                <h1 className="text-2xl font-bold text-slate-900">{flashlight.model}</h1>
              </div>
              {flashlight.is_discontinued && (
                <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded shrink-0">Discontinued</span>
              )}
            </div>

            {flashlight.category && (
              <span className="inline-block bg-brand-100 text-brand-800 text-xs px-2 py-0.5 rounded font-medium mb-3">
                {flashlight.category}
              </span>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              {flashlight.max_lumens && (
                <div className="bg-brand-50 rounded-lg p-3">
                  <div className="flex items-center gap-1 text-brand-600 text-xs mb-0.5"><Zap size={12} /> Max Output</div>
                  <div className="font-bold text-slate-900">{flashlight.max_lumens.toLocaleString()} lm</div>
                </div>
              )}
              {flashlight.beam_distance_m && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center gap-1 text-blue-600 text-xs mb-0.5"><Target size={12} /> Beam Distance</div>
                  <div className="font-bold text-slate-900">{flashlight.beam_distance_m} m</div>
                </div>
              )}
              {flashlight.battery_type && (
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center gap-1 text-green-600 text-xs mb-0.5"><Battery size={12} /> Battery</div>
                  <div className="font-bold text-slate-900">{flashlight.battery_type}</div>
                </div>
              )}
              {flashlight.weight_g && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1 text-slate-500 text-xs mb-0.5"><Weight size={12} /> Weight</div>
                  <div className="font-bold text-slate-900">{flashlight.weight_g} g</div>
                </div>
              )}
            </div>

            {flashlight.price_usd && (
              <div className="text-xl font-bold text-slate-900">${flashlight.price_usd}</div>
            )}

            <WishlistButtons flashlightId={flashlight.id} />
          </div>
        </div>

        {flashlight.notes && (
          <div className="mt-8 bg-white rounded-xl border border-slate-200 px-6 py-5">
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{flashlight.notes}</p>
          </div>
        )}

        <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Specifications</h2>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {specs.map((s, i) => (
                <tr key={s.label} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-6 py-2.5 text-slate-500 font-medium w-48">{s.label}</td>
                  <td className="px-6 py-2.5 text-slate-900">{s.value as string}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {flashlight.reviews && flashlight.reviews.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Reviews</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {flashlight.reviews.map((r: { id: string; type: string | null; title: string; reviewer: string | null; summary: string | null; url: string }) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 px-6 py-4 hover:bg-slate-50 group"
                >
                  <div className="mt-0.5 text-slate-400 group-hover:text-brand-500">
                    {r.type === 'video' ? <Video size={16} /> : <FileText size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 group-hover:text-brand-600">{r.title}</p>
                    {r.reviewer && <p className="text-xs text-slate-500 mt-0.5">{r.reviewer}</p>}
                    {r.summary && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{r.summary}</p>}
                  </div>
                  <ExternalLink size={12} className="text-slate-300 group-hover:text-brand-400 mt-1 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
        {flashlight.manual_url && (
          <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">User Manual</h2>
            </div>
            <a
              href={flashlight.manual_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-4 hover:bg-slate-50 group"
            >
              <BookOpen size={16} className="text-slate-400 group-hover:text-brand-500 shrink-0" />
              <span className="text-sm text-slate-700 group-hover:text-brand-600 flex-1">Download User Manual</span>
              <ExternalLink size={12} className="text-slate-300 group-hover:text-brand-400 shrink-0" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
