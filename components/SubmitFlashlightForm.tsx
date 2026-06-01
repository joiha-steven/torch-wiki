'use client'

import { useState, useRef } from 'react'
import { upload } from '@vercel/blob/client'
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile'
import { supabase } from '@/lib/supabase'
import { Flashlight } from '@/lib/types'
import { X, Upload, Loader2 } from 'lucide-react'
import Image from 'next/image'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!

const CATEGORIES = ['EDC', 'Tactical', 'Weapon Light', 'Thrower', 'Flood', 'Headlamp', 'Search & Rescue', 'Work', 'Custom']
const BATTERY_TYPES = ['CR123A', 'D-cell', 'AA', 'AAA', '10440', '14500', '18350', '18650', '21700', '26650', 'Built-in']
const BEAM_TYPES = ['Spot', 'Flood', 'Spot+Flood', 'Thrower']
const CHARGING_TYPES = ['usb', 'magnetic', 'none']

type ImageEntry = { id: string; url: string; file?: File; isPrimary: boolean; uploading: boolean }

type Props = {
  mode: 'new' | 'edit'
  initial?: Partial<Flashlight>
  targetId?: string
  onSuccess: () => void
  onCancel: () => void
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const input = "w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"

export default function SubmitFlashlightForm({ mode, initial = {}, targetId, onSuccess, onCancel }: Props) {
  const [data, setData] = useState<Partial<Flashlight>>({
    brand: '', model: '', category: null, year: null,
    max_lumens: null, min_lumens: null, beam_distance_m: null, beam_type: null,
    emitters: [], battery_type: null, battery_count: null,
    charging_type: null, has_usb_charging: false,
    length_mm: null, head_diameter_mm: null, body_diameter_mm: null, weight_g: null,
    material: null, ip_rating: null, impact_resistance_m: null,
    price_usd: null, description: null, notes: null, manual_url: null,
    is_discontinued: false,
    ...initial,
  })
  const [emitterInput, setEmitterInput] = useState((initial.emitters ?? []).join(', '))
  const [images, setImages] = useState<ImageEntry[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)

  const set = (k: keyof Flashlight, v: unknown) => setData(d => ({ ...d, [k]: v }))
  const num = (v: string) => v === '' ? null : Number(v)

  async function handleImageFiles(files: FileList) {
    const newEntries: ImageEntry[] = Array.from(files).map(f => ({
      id: crypto.randomUUID(), url: URL.createObjectURL(f), file: f,
      isPrimary: false, uploading: false,
    }))
    if (images.length === 0 && newEntries.length > 0) newEntries[0].isPrimary = true
    setImages(prev => [...prev, ...newEntries])
  }

  function removeImage(id: string) {
    setImages(prev => {
      const next = prev.filter(i => i.id !== id)
      if (next.length > 0 && !next.some(i => i.isPrimary)) next[0].isPrimary = true
      return next
    })
  }

  function setPrimary(id: string) {
    setImages(prev => prev.map(i => ({ ...i, isPrimary: i.id === id })))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!data.brand?.trim() || !data.model?.trim()) { setError('Brand và Model là bắt buộc.'); return }
    if (!captchaToken) { setError('Please complete the captcha.'); return }
    setSubmitting(true)
    setError(null)
    try {
      // 0. Verify captcha server-side
      const captchaRes = await fetch('/api/captcha-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken }),
      })
      const { success } = await captchaRes.json()
      if (!success) {
        setError('Captcha failed — please try again.')
        turnstileRef.current?.reset()
        setCaptchaToken(null)
        setSubmitting(false)
        return
      }

      // 1. Create submission row first
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      const submissionData = { ...data, emitters: emitterInput.split(',').map(s => s.trim()).filter(Boolean) }
      const { data: sub, error: subErr } = await supabase.from('flashlight_submissions').insert({
        user_id: user.id, type: mode, status: 'pending',
        target_id: targetId ?? null, data: submissionData, note: null,
      }).select().single()
      if (subErr) throw subErr

      // 2. Upload images to Vercel Blob
      for (const img of images) {
        if (!img.file) continue
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, uploading: true } : i))
        const ext = img.file.name.split('.').pop()
        const path = `submissions/${sub.id}/${img.id}.${ext}`
        const blob = await upload(path, img.file, { access: 'public', handleUploadUrl: '/api/upload' })
        await supabase.from('submission_images').insert({
          submission_id: sub.id, url: blob.url,
          sort_order: images.indexOf(img), is_primary: img.isPrimary,
        })
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, uploading: false } : i))
      }

      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Basic info */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Brand" required>
          <input className={input} value={data.brand ?? ''} onChange={e => set('brand', e.target.value)} placeholder="e.g. Surefire" />
        </Field>
        <Field label="Model" required>
          <input className={input} value={data.model ?? ''} onChange={e => set('model', e.target.value)} placeholder="e.g. M600DF Scout" />
        </Field>
        <Field label="Category">
          <select className={input} value={data.category ?? ''} onChange={e => set('category', e.target.value || null)}>
            <option value="">— Select —</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Year">
          <input className={input} type="number" value={data.year ?? ''} onChange={e => set('year', num(e.target.value))} placeholder="e.g. 2023" />
        </Field>
      </div>

      {/* Lumens & beam */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Output & Beam</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Max Lumens">
            <input className={input} type="number" value={data.max_lumens ?? ''} onChange={e => set('max_lumens', num(e.target.value))} placeholder="e.g. 1000" />
          </Field>
          <Field label="Min Lumens">
            <input className={input} type="number" value={data.min_lumens ?? ''} onChange={e => set('min_lumens', num(e.target.value))} placeholder="e.g. 5" />
          </Field>
          <Field label="Beam Distance (m)">
            <input className={input} type="number" value={data.beam_distance_m ?? ''} onChange={e => set('beam_distance_m', num(e.target.value))} placeholder="e.g. 300" />
          </Field>
          <Field label="Beam Type">
            <select className={input} value={data.beam_type ?? ''} onChange={e => set('beam_type', e.target.value || null)}>
              <option value="">— Select —</option>
              {BEAM_TYPES.map(b => <option key={b}>{b}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* LED */}
      <Field label="LED / Emitters (phân cách bằng dấu phẩy nếu nhiều LED)">
        <input className={input} value={emitterInput} onChange={e => setEmitterInput(e.target.value)} placeholder="e.g. Cree XHP50.2, Luminus SBT90.3" />
      </Field>

      {/* Battery */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Battery & Charging</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Battery Type">
            <select className={input} value={data.battery_type ?? ''} onChange={e => set('battery_type', e.target.value || null)}>
              <option value="">— Select —</option>
              {BATTERY_TYPES.map(b => <option key={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Battery Count">
            <input className={input} type="number" value={data.battery_count ?? ''} onChange={e => set('battery_count', num(e.target.value))} placeholder="e.g. 1" />
          </Field>
          <Field label="Charging">
            <select className={input} value={data.charging_type ?? ''} onChange={e => set('charging_type', e.target.value || null)}>
              <option value="">— Select —</option>
              {CHARGING_TYPES.map(c => <option key={c} value={c}>{c === 'usb' ? 'USB' : c === 'magnetic' ? 'Magnetic' : 'None'}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Dimensions */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Size & Weight</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Length (mm)">
            <input className={input} type="number" value={data.length_mm ?? ''} onChange={e => set('length_mm', num(e.target.value))} />
          </Field>
          <Field label="Head Diameter (mm)">
            <input className={input} type="number" value={data.head_diameter_mm ?? ''} onChange={e => set('head_diameter_mm', num(e.target.value))} />
          </Field>
          <Field label="Body Diameter (mm)">
            <input className={input} type="number" value={data.body_diameter_mm ?? ''} onChange={e => set('body_diameter_mm', num(e.target.value))} />
          </Field>
          <Field label="Weight (g)">
            <input className={input} type="number" value={data.weight_g ?? ''} onChange={e => set('weight_g', num(e.target.value))} />
          </Field>
        </div>
      </div>

      {/* Material & specs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Field label="Material">
          <input className={input} value={data.material ?? ''} onChange={e => set('material', e.target.value || null)} placeholder="e.g. Aluminum" />
        </Field>
        <Field label="IP Rating">
          <input className={input} value={data.ip_rating ?? ''} onChange={e => set('ip_rating', e.target.value || null)} placeholder="e.g. IPX8" />
        </Field>
        <Field label="Impact Resistance (m)">
          <input className={input} type="number" value={data.impact_resistance_m ?? ''} onChange={e => set('impact_resistance_m', num(e.target.value))} />
        </Field>
        <Field label="Est. Retail Price (USD)">
          <input className={input} type="number" value={data.price_usd ?? ''} onChange={e => set('price_usd', num(e.target.value))} placeholder="e.g. 349" />
        </Field>
      </div>

      {/* Text fields */}
      <Field label="Description">
        <textarea className={input + ' resize-none'} rows={3} value={data.description ?? ''} onChange={e => set('description', e.target.value || null)} placeholder="Short product description..." />
      </Field>
      <Field label="User Manual URL">
        <input className={input} type="url" value={data.manual_url ?? ''} onChange={e => set('manual_url', e.target.value || null)} placeholder="https://..." />
      </Field>

      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
        <input type="checkbox" checked={data.is_discontinued ?? false} onChange={e => set('is_discontinued', e.target.checked)} className="accent-brand-500" />
        Discontinued
      </label>

      {/* Images */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Images</p>
        {images.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {images.map((img) => (
              <div key={img.id} className="relative group">
                <div className={`w-24 h-24 rounded-lg border-2 overflow-hidden bg-white ${img.isPrimary ? 'border-brand-500' : 'border-slate-200'}`}>
                  <Image src={img.url} alt="" fill className="object-contain p-1" />
                  {img.uploading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 size={16} className="animate-spin text-brand-500" />
                    </div>
                  )}
                </div>
                <div className="absolute -top-1.5 -right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => removeImage(img.id)} className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X size={10} />
                  </button>
                </div>
                {!img.isPrimary && (
                  <button type="button" onClick={() => setPrimary(img.id)} className="mt-1 w-full text-[10px] text-slate-400 hover:text-brand-600 text-center">
                    Set primary
                  </button>
                )}
                {img.isPrimary && <p className="mt-1 text-[10px] text-brand-600 text-center font-medium">Primary</p>}
              </div>
            ))}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && handleImageFiles(e.target.files)} />
        <button type="button" onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 text-sm text-slate-600 border border-dashed border-slate-300 rounded-lg px-4 py-2.5 hover:border-brand-400 hover:text-brand-600 transition-colors">
          <Upload size={14} />
          Upload images
        </button>
        <p className="text-xs text-slate-400 mt-1.5">Ảnh đầu tiên hoặc ô marked "Primary" sẽ là ảnh chính. Kéo để sắp xếp thứ tự.</p>
      </div>

      <Turnstile
        ref={turnstileRef}
        siteKey={SITE_KEY}
        onSuccess={token => setCaptchaToken(token)}
        onExpire={() => setCaptchaToken(null)}
        options={{ theme: 'light', size: 'flexible' }}
      />

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 text-sm text-slate-600 border border-slate-200 rounded-lg py-2.5 hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={submitting || !captchaToken}
          className="flex-1 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-black text-sm font-medium rounded-lg py-2.5 flex items-center justify-center gap-2">
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitting ? 'Submitting…' : mode === 'new' ? 'Submit for review' : 'Submit edit'}
        </button>
      </div>
    </form>
  )
}
