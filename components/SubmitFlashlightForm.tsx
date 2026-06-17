'use client'

import { Turnstile } from '@marsidev/react-turnstile'
import { Flashlight } from '@/lib/types'
import MarkdownEditor from '@/components/MarkdownEditor'
import { Field } from '@/components/submit/shared'
import EmitterInput from '@/components/submit/EmitterInput'
import BasicFields from '@/components/submit/BasicFields'
import { OutputBeamFields, DimensionFields } from '@/components/submit/SpecFields'
import BatterySection from '@/components/submit/BatterySection'
import MaterialSection from '@/components/submit/MaterialSection'
import PdfSection from '@/components/submit/PdfSection'
import ReviewsSection from '@/components/submit/ReviewsSection'
import ImagesSection from '@/components/submit/ImagesSection'
import FormFooter from '@/components/submit/FormFooter'
import { useFlashlightForm } from '@/components/submit/useFlashlightForm'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!

type Props = {
  mode: 'new' | 'edit'
  initial?: Partial<Flashlight>
  targetId?: string
  onSuccess: (slug?: string) => void
  onCancel: () => void
}

// Thin composition root: all state + handlers + submit live in useFlashlightForm
// (CLAUDE.md #7 - the project scales by adding files, not growing them).
export default function SubmitFlashlightForm({ mode, initial = {}, targetId, onSuccess, onCancel }: Props) {
  const {
    isAdmin, data, set, num,
    emitterInput, setEmitterInput,
    materialRows, setMaterialRows,
    batteryRows, updateBatteryRow, addBatteryRow, removeBatteryRow,
    images, fileRef, handleImageFiles, removeImage, setPrimary,
    pdfFiles, pdfUploading, pdfRef, handlePdfFile, removePdf,
    reviewRows, updateReview, addReviewRow, removeReviewRow, fetchReviewMeta,
    submitting, error, captchaToken, setCaptchaToken, turnstileRef,
    handleSubmit,
  } = useFlashlightForm({ mode, initial, targetId, onSuccess })

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BasicFields data={data} set={set} num={num} currentSlug={mode === 'edit' ? (data.slug as string | undefined) : undefined} />

      <OutputBeamFields data={data} set={set} num={num} />
      <Field label="LED / Emitters (comma-separated if multiple)" hint="Brand + model in proper case, e.g. Nichia 519A, Cree XHP-70.3 HI. Don't add CRI, colour temp or tint (no 'R9080 4000K High CRI'). Pick a suggestion when it exists. Use UV / IR / Laser / LEP as-is.">
        <EmitterInput value={emitterInput} onChange={setEmitterInput} />
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
      <MaterialSection rows={materialRows} onChange={setMaterialRows} />

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
