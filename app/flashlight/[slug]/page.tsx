import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Zap, Target, Battery, Weight, ExternalLink, Video, FileText, ChevronLeft } from 'lucide-react'

type Props = { params: Promise<{ slug: string }> }

export default async function FlashlightPage({ params }: Props) {
  const { slug } = await params

  const { data: flashlight } = await supabase
    .from('flashlights')
    .select('*, reviews(*)')
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
    { label: 'LED / Emitter', value: flashlight.emitter },
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
      <header className="bg-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-11 flex items-center gap-3">
          <Link href="/" className="font-bold text-base shrink-0" style={{ color: '#FFBE00' }}>Torch Wiki</Link>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-400 text-sm truncate">{flashlight.brand} {flashlight.model}</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6">
          <ChevronLeft size={14} /> Back to browse
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-center min-h-64">
            {flashlight.image_url ? (
              <Image
                src={flashlight.image_url}
                alt={`${flashlight.brand} ${flashlight.model}`}
                width={400}
                height={300}
                className="object-contain max-h-72"
              />
            ) : (
              <div className="text-slate-300 text-sm">No image available</div>
            )}
          </div>

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
              <span className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded font-medium mb-3">
                {flashlight.category}
              </span>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              {flashlight.max_lumens && (
                <div className="bg-amber-50 rounded-lg p-3">
                  <div className="flex items-center gap-1 text-amber-600 text-xs mb-0.5"><Zap size={12} /> Max Output</div>
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
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Full Specifications</h2>
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
                  <div className="mt-0.5 text-slate-400 group-hover:text-amber-500">
                    {r.type === 'video' ? <Video size={16} /> : <FileText size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 group-hover:text-amber-600">{r.title}</p>
                    {r.reviewer && <p className="text-xs text-slate-500 mt-0.5">{r.reviewer}</p>}
                    {r.summary && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{r.summary}</p>}
                  </div>
                  <ExternalLink size={12} className="text-slate-300 group-hover:text-amber-400 mt-1 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
