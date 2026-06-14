import { RefObject } from 'react'
import Image from 'next/image'
import { X, Upload, Loader2, Star } from 'lucide-react'
import { ImageEntry } from './shared'

type Props = {
  images: ImageEntry[]
  fileRef: RefObject<HTMLInputElement | null>
  onAddFiles: (files: FileList) => void
  onRemove: (id: string) => void
  onSetPrimary: (id: string) => void
}

export default function ImagesSection({ images, fileRef, onAddFiles, onRemove, onSetPrimary }: Props) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-ink-2 mb-3">Images</p>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <div className={`w-24 h-24 rounded-lg border-2 overflow-hidden bg-plate relative ${img.isPrimary ? 'border-brand-500' : 'border-line'}`}>
                <Image src={img.url} alt="" fill className="object-contain p-1" unoptimized={img.url.startsWith('blob:')} />
                {img.uploading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin text-brand-500" />
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                  {!img.isPrimary && (
                    <button type="button" onClick={() => onSetPrimary(img.id)}
                      className="bg-panel rounded-full p-1 hover:bg-brand-50" title="Set as primary">
                      <Star size={11} className="text-brand-600" />
                    </button>
                  )}
                  <button type="button" onClick={() => onRemove(img.id)}
                    className="bg-panel rounded-full p-1 hover:bg-red-50" title="Remove">
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
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && onAddFiles(e.target.files)} />
      <button type="button" onClick={() => fileRef.current?.click()}
        className="flex items-center gap-2 text-sm text-ink-2 border border-dashed border-line-strong rounded-lg px-4 py-2.5 hover:border-brand-400 hover:text-brand-600 transition-colors">
        <Upload size={14} />
        Add images
      </button>
      <p className="text-xs text-ink-3 mt-1.5 inline-flex items-center gap-1">
        Hover an image to remove it or set it as primary
        (<Star size={11} className="text-brand-500 inline" />).
      </p>
    </div>
  )
}
