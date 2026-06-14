import { RefObject } from 'react'
import { X, Upload, Loader2, FileText } from 'lucide-react'
import { Field } from './shared'

type Props = {
  files: { url: string; name: string }[]
  uploading: boolean
  pdfRef: RefObject<HTMLInputElement | null>
  onPick: () => void
  onRemove: (idx: number) => void
  onFileChange: (file: File) => void
}

export default function PdfSection({ files, uploading, pdfRef, onPick, onRemove, onFileChange }: Props) {
  return (
    <Field label="User Manual (PDF)">
      <div className="space-y-2">
        {files.map((f, i) => (
          <div key={f.url} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-white/[0.04] border border-line rounded-lg text-sm text-ink-2">
            <FileText size={14} className="text-brand-500 shrink-0" />
            <span className="truncate flex-1">{f.name}</span>
            <button type="button" onClick={() => onRemove(i)} className="text-ink-3 hover:text-red-500 shrink-0">
              <X size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={onPick}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 border border-dashed border-line-strong rounded-lg text-sm text-ink-3 hover:border-brand-400 hover:text-brand-600 transition-colors"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? 'Uploading…' : files.length ? 'Add another PDF' : 'Upload PDF'}
        </button>
        <input
          ref={pdfRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFileChange(f) }}
        />
      </div>
    </Field>
  )
}
