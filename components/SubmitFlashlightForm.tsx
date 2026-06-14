'use client'

import { useState, useRef } from 'react'
import { upload } from '@vercel/blob/client'
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile'
import { supabase } from '@/lib/supabase'
import { Flashlight, BatteryOption } from '@/lib/types'
import MarkdownEditor from '@/components/MarkdownEditor'
import { useIsAdmin } from '@/lib/use-is-admin'
import { batteryOptions } from '@/lib/battery'
import { trackEvent, AnalyticsEvent } from '@/lib/analytics'
import { Field, input, type ImageEntry, type ReviewRow } from '@/components/submit/shared'
import BasicFields from '@/components/submit/BasicFields'
import { OutputBeamFields, DimensionFields } from '@/components/submit/SpecFields'
import BatterySection from '@/components/submit/BatterySection'
import PdfSection from '@/components/submit/PdfSection'
import ReviewsSection from '@/components/submit/ReviewsSection'
import ImagesSection from '@/components/submit/ImagesSection'
import FormFooter from '@/components/submit/FormFooter'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!

type Props = {
  mode: 'new' | 'edit'
  initial?: Partial<Flashlight>
  targetId?: string
  onSuccess: (slug?: string) => void
  onCancel: () => void
}

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
      const { data: { session: upSession } } = await supabase.auth.getSession()
      const uploadPayload = JSON.stringify({ session: upSession?.access_token ?? '' })

      for (let imgIndex = 0; imgIndex < images.length; imgIndex++) {
        const img = images[imgIndex]
        if (!img.file || img.isExisting) continue
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, uploading: true } : i))
        const ext = img.file.name.split('.').pop()
        const path = `submissions/${sub.id}/${img.id}.${ext}`
        const blob = await upload(path, img.file, { access: 'public', handleUploadUrl: '/api/upload', clientPayload: uploadPayload })
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

      trackEvent(mode === 'edit' ? AnalyticsEvent.ContributionEdit : AnalyticsEvent.ContributionNew)
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <BasicFields data={data} set={set} num={num} />

      <OutputBeamFields data={data} set={set} num={num} />

      <Field label="LED / Emitters (comma-separated if multiple)">
        <input className={input} value={emitterInput} onChange={e => setEmitterInput(e.target.value)} placeholder="e.g. Cree XHP50.2, Luminus SBT90.3" />
      </Field>

      <BatterySection
        rows={batteryRows}
        updateRow={updateBatteryRow}
        addRow={addBatteryRow}
        removeRow={removeBatteryRow}
        chargingType={data.charging_type ?? null}
        onChargingChange={v => set('charging_type', v)}
      />

      <DimensionFields data={data} set={set} num={num} />

      {/* Text fields */}
      <MarkdownEditor label="Description" value={data.description ?? ''} onChange={v => set('description', v || null)} />

      <PdfSection
        files={pdfFiles}
        uploading={pdfUploading}
        pdfRef={pdfRef}
        onPick={() => pdfRef.current?.click()}
        onRemove={removePdf}
        onFileChange={handlePdfFile}
      />

      <ReviewsSection
        rows={reviewRows}
        updateReview={updateReview}
        addReviewRow={addReviewRow}
        removeReviewRow={removeReviewRow}
        fetchReviewMeta={fetchReviewMeta}
      />

      <label className="flex items-center gap-2 text-sm text-ink-2 cursor-pointer">
        <input type="checkbox" checked={data.is_discontinued ?? false} onChange={e => set('is_discontinued', e.target.checked)} className="accent-brand-500" />
        Discontinued
      </label>

      <ImagesSection
        images={images}
        fileRef={fileRef}
        onAddFiles={handleImageFiles}
        onRemove={removeImage}
        onSetPrimary={setPrimary}
      />

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

      <FormFooter isAdmin={isAdmin} mode={mode} submitting={submitting} captchaToken={captchaToken} onCancel={onCancel} />
    </form>
  )
}
