'use client'

import { useState, useRef } from 'react'
import { upload } from '@vercel/blob/client'
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile'
import { supabase } from '@/lib/supabase'
import { Flashlight, BatteryOption } from '@/lib/types'
import { X, Upload, Loader2, FileText, Star, Plus } from 'lucide-react'
import Image from 'next/image'
import MarkdownEditor from '@/components/MarkdownEditor'
import { useIsAdmin } from '@/lib/use-is-admin'
import { batteryOptions } from '@/lib/battery'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!

const CATEGORIES = ['EDC', 'Tactical', 'Weapon Light', 'Thrower', 'Flood', 'Headlamp', 'Search & Rescue', 'Diving', 'Work', 'Custom']
const BATTERY_TYPES = ['CR123A', 'D-cell', 'AA', 'AAA', '10440', '14500', '16340', '18350', '18650', '21700', '26650', 'Built-in']
const BEAM_TYPES = ['Spot', 'Flood', 'Spot+Flood', 'Thrower']
const CHARGING_TYPES = ['usb', 'magnetic', 'none']

type ImageEntry = {
  id: string           // 'existing-primary' | 'existing-{dbId}' | uuid for new
  url: string          // Vercel Blob URL for existing, object URL for new
  file?: File          // only for new images
  isPrimary: boolean
  uploading: boolean
  isExisting: boolean  // already stored in DB
  existingDbId?: string // flashlight_images.id (for extras)
}

type ReviewRow = {
  url: string
  title: string
  published_at: string | null   // ISO date
  type: string | null           // 'video' | 'article'
  fetching?: boolean
}

type Props = {
  mode: 'new' | 'edit'
  initial?: Partial<Flashlight>
  targetId?: string
  onSuccess: (slug?: string) => void
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

const input = "w-full h-10 text-sm border border-slate-200 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"


export default function SubmitFlashlightForm({ mode, initial = {}, targetId, onSuccess, onCancel }: Props) {
  const isAdmin = useIsAdmin()
  const [data, setData] = useState<Partial<Flashlight>>({
    brand: '', model: '', category: null, year: null,
    max_lumens: null, min_lumens: null, beam_distance_m: null, beam_type: null,
    emitters: [], battery_type: null, battery_count: null,
    charging_type: null, has_usb_charging: false,
    length_mm: null, head_diameter_mm: null, body_diameter_mm: null, weight_g: null,
    material: null, ip_rating: null, impact_resistance_m: null,
    price_usd: null, description: null, manual_url: null,
    is_discontinued: false,
    ...initial,
  })
  const [emitterInput, setEmitterInput] = useState((initial.emitters ?? []).join(', '))
  // Battery configurations — each row is a { type, count } pair (e.g. 2×18350 OR 1×18650)
  const [batteryRows, setBatteryRows] = useState<BatteryOption[]>(() => {
    const opts = batteryOptions(initial)
    return opts.length > 0 ? opts.map(o => ({ type: o.type, count: o.count })) : [{ type: '', count: 1 }]
  })
  // Initialise with existing images for edit mode
  const [images, setImages] = useState<ImageEntry[]>(() => {
    if (mode !== 'edit') return []
    const existing: ImageEntry[] = []
    if (initial?.image_url) {
      existing.push({ id: 'existing-primary', url: initial.image_url, isPrimary: true, uploading: false, isExisting: true })
    }
    const extras = (initial?.flashlight_images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order)
    for (const img of extras) {
      existing.push({ id: `existing-${img.id}`, url: img.url, isPrimary: false, uploading: false, isExisting: true, existingDbId: img.id })
    }
    return existing
  })
  // Track which existing extras were removed (DB ids)
  const [removedExtraDbIds, setRemovedExtraDbIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [pdfUploading, setPdfUploading] = useState(false)
  // Multiple PDFs: list of {url, name}
  const [pdfFiles, setPdfFiles] = useState<{ url: string; name: string }[]>(() => {
    // Use manual_urls if it has entries, else fall back to legacy manual_url
    const urls = (initial?.manual_urls?.length ? initial.manual_urls : null)
      ?? (initial?.manual_url ? [initial.manual_url] : [])
    return urls.map((url, i) => ({ url, name: i === 0 ? 'manual.pdf' : `manual-${i}.pdf` }))
  })
  // Review links — paste a URL, the system auto-fills title + post date (editable)
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>(() =>
    (initial?.reviews ?? []).map(r => ({
      url: r.url, title: r.title ?? '', published_at: r.published_at ?? null, type: r.type ?? null, fetching: false,
    }))
  )
  const fileRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)

  const set = (k: keyof Flashlight, v: unknown) => setData(d => ({ ...d, [k]: v }))
  const num = (v: string) => v === '' ? null : Number(v)

  const updateBatteryRow = (i: number, patch: Partial<BatteryOption>) =>
    setBatteryRows(rows => rows.map((r, j) => j === i ? { ...r, ...patch } : r))
  const addBatteryRow = () => setBatteryRows(rows => [...rows, { type: '', count: 1 }])
  const removeBatteryRow = (i: number) => setBatteryRows(rows => rows.filter((_, j) => j !== i))

  async function handleImageFiles(files: FileList) {
    const newEntries: ImageEntry[] = Array.from(files).map(f => ({
      id: crypto.randomUUID(), url: URL.createObjectURL(f), file: f,
      isPrimary: false, uploading: false, isExisting: false,
    }))
    if (images.length === 0 && newEntries.length > 0) newEntries[0].isPrimary = true
    setImages(prev => [...prev, ...newEntries])
  }

  async function handlePdfFile(file: File) {
    if (file.type !== 'application/pdf') return
    setPdfUploading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const blob = await upload(`submissions/manuals/${crypto.randomUUID()}.pdf`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload-pdf',
        clientPayload: session?.access_token ?? '',
      })
      const newFiles = [...pdfFiles, { url: blob.url, name: file.name }]
      setPdfFiles(newFiles)
      // sync manual_urls into form data
      setData(d => ({ ...d, manual_urls: newFiles.map(f => f.url), manual_url: newFiles[0]?.url ?? null }))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setPdfUploading(false)
      if (pdfRef.current) pdfRef.current.value = ''
    }
  }

  function removePdf(idx: number) {
    const newFiles = pdfFiles.filter((_, i) => i !== idx)
    setPdfFiles(newFiles)
    setData(d => ({ ...d, manual_urls: newFiles.map(f => f.url), manual_url: newFiles[0]?.url ?? null }))
  }

  // ── Review links ──
  const updateReview = (i: number, patch: Partial<ReviewRow>) =>
    setReviewRows(rows => rows.map((r, j) => j === i ? { ...r, ...patch } : r))
  const addReviewRow = () => setReviewRows(rows => [...rows, { url: '', title: '', published_at: null, type: null }])
  const removeReviewRow = (i: number) => setReviewRows(rows => rows.filter((_, j) => j !== i))

  // Fetch title + post date for a pasted review URL
  async function fetchReviewMeta(i: number) {
    const row = reviewRows[i]
    if (!row?.url?.trim()) return
    updateReview(i, { fetching: true })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/fetch-review-meta', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token ?? ''}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: row.url.trim() }),
      })
      const meta = await res.json() as { title?: string | null; published_at?: string | null; type?: string | null }
      updateReview(i, {
        // Only fill blanks — don't clobber what the user already typed/edited
        title: row.title?.trim() ? row.title : (meta.title ?? ''),
        published_at: row.published_at ?? meta.published_at ?? null,
        type: row.type ?? meta.type ?? null,
        fetching: false,
      })
    } catch {
      updateReview(i, { fetching: false })
    }
  }

  function removeImage(id: string) {
    const img = images.find(i => i.id === id)
    if (img?.isExisting && img.existingDbId) {
      setRemovedExtraDbIds(r => [...r, img.existingDbId!])
    }
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
    if (!data.brand?.trim() || !data.model?.trim()) { setError('Brand and Model are required.'); return }
    if (!isAdmin && !captchaToken) { setError('Please complete the captcha.'); return }
    setSubmitting(true)
    setError(null)
    try {
      // 0. Verify captcha (skipped for admin/mod)
      if (!isAdmin) {
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
      }

      // 1. Create submission row — always 'pending'; admin PATCH promotes to 'approved'
      const [{ data: { session } }, { data: { user } }] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser(),
      ])
      if (!user) throw new Error('Not signed in')

      // Strip join fields (reviews, flashlight_images) — not DB columns, would cause update to fail
      const { reviews: _r, flashlight_images: _fi, ...cleanData } = data as Record<string, unknown>
      const battery_options = batteryRows
        .filter(r => r.type)
        .map(r => ({ type: r.type, count: r.count > 0 ? r.count : 1 }))
      const battery_types = battery_options.map(o => o.type)
      const submissionData = {
        ...cleanData,
        emitters: emitterInput.split(',').map(s => s.trim()).filter(Boolean),
        battery_options,
        battery_types,
        battery_type: battery_options[0]?.type ?? null,   // legacy mirror
        battery_count: battery_options[0]?.count ?? null,  // legacy mirror
      }
      const { data: sub, error: subErr } = await supabase.from('flashlight_submissions').insert({
        user_id: user.id, type: mode, status: 'pending',
        target_id: targetId ?? null, data: submissionData, note: null,
      }).select().single()
      if (subErr) throw subErr

      // 2. Upload NEW images to Vercel Blob, track URLs for approval
      const uploadedImages: { url: string; sort_order: number; is_primary: boolean }[] = []
      const uploadedUrlById = new Map<string, string>() // img.id → vercel URL

      for (let imgIndex = 0; imgIndex < images.length; imgIndex++) {
        const img = images[imgIndex]
        if (!img.file || img.isExisting) continue
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, uploading: true } : i))
        const ext = img.file.name.split('.').pop()
        const path = `submissions/${sub.id}/${img.id}.${ext}`
        const blob = await upload(path, img.file, { access: 'public', handleUploadUrl: '/api/upload' })
        uploadedUrlById.set(img.id, blob.url)
        const imgRecord = { submission_id: sub.id, url: blob.url, sort_order: imgIndex, is_primary: img.isPrimary }
        await supabase.from('submission_images').insert(imgRecord)
        uploadedImages.push({ url: blob.url, sort_order: imgIndex, is_primary: img.isPrimary })
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, uploading: false } : i))
      }

      // For edit mode: compute final primary URL and extras to remove
      let _primaryImageUrl: string | null | undefined = undefined
      if (mode === 'edit') {
        const primaryEntry = images.find(i => i.isPrimary)
        if (!primaryEntry) {
          _primaryImageUrl = null
        } else if (!primaryEntry.isExisting) {
          _primaryImageUrl = uploadedUrlById.get(primaryEntry.id) ?? null
        } else {
          // Existing image (primary or promoted extra)
          _primaryImageUrl = primaryEntry.url
        }
      }

      // Review links — keep only rows with a URL; trim + carry title/date/type
      const _reviews = reviewRows
        .filter(r => r.url.trim())
        .map(r => ({
          url: r.url.trim(),
          title: r.title.trim() || r.url.trim(),
          published_at: r.published_at,
          type: r.type,
        }))

      // Rebuild submissionData with image + review directives
      const finalSubmissionData = {
        ...submissionData,
        _reviews,
        ...(mode === 'edit' ? {
          _primaryImageUrl,
          _removeExtraDbIds: removedExtraDbIds,
        } : {}),
      }

      // 2b. Persist image directives into the submission row (for both admin and pending paths)
      //     so that when a mod approves a pending edit the image changes are applied correctly.
      // Persist directives for BOTH modes so a mod approving later from the
      // pending queue applies the same image + review changes (new mode needs
      // this for _reviews; edit mode also for the image directives).
      await supabase.from('flashlight_submissions').update({ data: finalSubmissionData }).eq('id', sub.id)

      // 3. Admin/mod: auto-approve — apply changes immediately
      if (isAdmin) {
        const token = session?.access_token ?? ''
        const res = await fetch('/api/admin/submissions', {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: sub.id,
            action: 'approved',
            submissionData: { type: mode, data: finalSubmissionData },
            targetId: targetId ?? null,
            submissionImages: uploadedImages,
          }),
        })
        const json = await res.json() as { ok?: boolean; slug?: string; error?: string }
        if (!res.ok) throw new Error(json.error ?? 'Auto-approve failed')
        // Edit → revalidate that specific page; new → revalidate browse layout
        const revalidateBody = mode === 'edit' && json.slug
          ? { slug: json.slug }
          : { all: true }
        await fetch('/api/revalidate', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(revalidateBody) })
        localStorage.removeItem('meta_cache')
        // Hard navigate — bypasses Next.js client-side router cache to guarantee fresh page
        if (json.slug) {
          window.location.href = `/${json.slug}`
        } else {
          onSuccess()
        }
        return
      }

      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
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
        <p className="text-[13px] font-semibold text-slate-600 mb-3">Output & Beam</p>
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
      <Field label="LED / Emitters (comma-separated if multiple)">
        <input className={input} value={emitterInput} onChange={e => setEmitterInput(e.target.value)} placeholder="e.g. Cree XHP50.2, Luminus SBT90.3" />
      </Field>

      {/* Battery */}
      <div>
        <p className="text-[13px] font-semibold text-slate-600 mb-3">Battery & Charging</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Battery options</label>
            <div className="space-y-2">
              {batteryRows.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="number" min={1} aria-label="Count" className={input + ' w-16 shrink-0'}
                    value={row.count} onChange={e => updateBatteryRow(i, { count: Number(e.target.value) || 1 })} />
                  <span className="text-slate-400 text-sm shrink-0">×</span>
                  <select className={input + ' flex-1'} value={row.type} onChange={e => updateBatteryRow(i, { type: e.target.value })}>
                    <option value="">— Select —</option>
                    {BATTERY_TYPES.map(b => <option key={b}>{b}</option>)}
                  </select>
                  {batteryRows.length > 1 && (
                    <button type="button" onClick={() => removeBatteryRow(i)} title="Remove"
                      className="text-slate-300 hover:text-red-400 shrink-0"><X size={15} /></button>
                  )}
                </div>
              ))}
            </div>
            {batteryRows.length < 4 && (
              <button type="button" onClick={addBatteryRow}
                className="mt-2 inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700">
                <Plus size={13} /> Add battery option
              </button>
            )}
            <p className="mt-1 text-xs text-slate-400">Add more than one if the light accepts alternatives — e.g. 2× 18350 or 1× 18650.</p>
          </div>
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
        <p className="text-[13px] font-semibold text-slate-600 mb-3">Size & Weight</p>
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
      <MarkdownEditor label="Description" value={data.description ?? ''} onChange={v => set('description', v || null)} />

      <Field label="User Manual (PDF)">
        <div className="space-y-2">
          {pdfFiles.map((f, i) => (
            <div key={f.url} className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
              <FileText size={14} className="text-brand-500 shrink-0" />
              <span className="truncate flex-1">{f.name}</span>
              <button type="button" onClick={() => removePdf(i)} className="text-slate-400 hover:text-red-500 shrink-0">
                <X size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => pdfRef.current?.click()}
            disabled={pdfUploading}
            className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600 transition-colors"
          >
            {pdfUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {pdfUploading ? 'Uploading…' : pdfFiles.length ? 'Add another PDF' : 'Upload PDF'}
          </button>
          <input
            ref={pdfRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfFile(f) }}
          />
        </div>
      </Field>

      <Field label="Reviews">
        <p className="text-xs text-slate-400 mb-2">Paste a review link — the title and post date are filled in automatically (you can edit them). Add as many as you like.</p>
        <div className="space-y-3">
          {reviewRows.map((r, i) => (
            <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={r.url}
                  onChange={e => updateReview(i, { url: e.target.value })}
                  onBlur={() => { if (r.url.trim() && !r.title.trim()) fetchReviewMeta(i) }}
                  placeholder="https://…  (review article or video URL)"
                  className={input + ' flex-1'}
                />
                <button type="button" onClick={() => fetchReviewMeta(i)} disabled={r.fetching || !r.url.trim()}
                  className="h-10 px-3 shrink-0 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-50 flex items-center gap-1.5">
                  {r.fetching ? <Loader2 size={13} className="animate-spin" /> : null}
                  {r.fetching ? 'Fetching' : 'Fetch'}
                </button>
                <button type="button" onClick={() => removeReviewRow(i)} className="text-slate-400 hover:text-red-500 shrink-0">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                <input
                  type="text"
                  value={r.title}
                  onChange={e => updateReview(i, { title: e.target.value })}
                  placeholder="Title (auto-filled)"
                  className={input}
                />
                <input
                  type="date"
                  value={r.published_at ? r.published_at.slice(0, 10) : ''}
                  onChange={e => updateReview(i, { published_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className={input + ' sm:w-44'}
                />
              </div>
            </div>
          ))}
          <button type="button" onClick={addReviewRow}
            className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600 transition-colors">
            <Plus size={14} /> Add review link
          </button>
        </div>
      </Field>

      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
        <input type="checkbox" checked={data.is_discontinued ?? false} onChange={e => set('is_discontinued', e.target.checked)} className="accent-brand-500" />
        Discontinued
      </label>

      {/* Images */}
      <div>
        <p className="text-[13px] font-semibold text-slate-600 mb-3">Images</p>
        {images.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {images.map((img) => (
              <div key={img.id} className="relative group">
                <div className={`w-24 h-24 rounded-lg border-2 overflow-hidden bg-white relative ${img.isPrimary ? 'border-brand-500' : 'border-slate-200'}`}>
                  <Image src={img.url} alt="" fill className="object-contain p-1" unoptimized={img.url.startsWith('blob:')} />
                  {img.uploading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 size={16} className="animate-spin text-brand-500" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                    {!img.isPrimary && (
                      <button type="button" onClick={() => setPrimary(img.id)}
                        className="bg-white rounded-full p-1 hover:bg-brand-50" title="Set as primary">
                        <Star size={11} className="text-brand-600" />
                      </button>
                    )}
                    <button type="button" onClick={() => removeImage(img.id)}
                      className="bg-white rounded-full p-1 hover:bg-red-50" title="Remove">
                      <X size={11} className="text-red-500" />
                    </button>
                  </div>
                </div>
                {img.isPrimary
                  ? <p className="mt-1 text-[10px] text-brand-600 text-center font-medium">Primary</p>
                  : <p className="mt-1 text-[10px] text-slate-300 text-center">&nbsp;</p>}
              </div>
            ))}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && handleImageFiles(e.target.files)} />
        <button type="button" onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 text-sm text-slate-600 border border-dashed border-slate-300 rounded-lg px-4 py-2.5 hover:border-brand-400 hover:text-brand-600 transition-colors">
          <Upload size={14} />
          Add images
        </button>
        <p className="text-xs text-slate-400 mt-1.5 inline-flex items-center gap-1">
          Hover an image to remove it or set it as primary
          (<Star size={11} className="text-brand-500 inline" />).
        </p>
      </div>

      {!isAdmin && (
        <Turnstile
          ref={turnstileRef}
          siteKey={SITE_KEY}
          onSuccess={token => setCaptchaToken(token)}
          onExpire={() => setCaptchaToken(null)}
          options={{ theme: 'light', size: 'flexible' }}
        />
      )}

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <p className="text-[11px] text-slate-400 leading-relaxed">
        By submitting, you agree your contribution is factual data from legitimate sources, and any original text you write is licensed under{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-slate-600">CC BY 4.0</a>.
      </p>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 text-sm text-slate-600 border border-slate-200 rounded-lg py-2.5 hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={submitting || (!isAdmin && !captchaToken)}
          className="flex-1 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-black text-sm font-medium rounded-lg py-2.5 flex items-center justify-center gap-2">
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitting
            ? (isAdmin ? 'Saving…' : 'Submitting…')
            : isAdmin
              ? (mode === 'new' ? 'Add flashlight' : 'Save changes')
              : (mode === 'new' ? 'Submit for review' : 'Submit edit')}
        </button>
      </div>
    </form>
  )
}
