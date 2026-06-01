'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FlashlightImage } from '@/lib/types'

type Props = {
  primaryUrl: string | null
  extraImages: FlashlightImage[]
  alt: string
}

export default function ImageGallery({ primaryUrl, extraImages, alt }: Props) {
  const allUrls = [
    ...(primaryUrl ? [primaryUrl] : []),
    ...extraImages.map((img) => img.url),
  ]

  const [active, setActive] = useState(0)

  if (allUrls.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-center min-h-64">
        <span className="text-slate-300 text-sm">No image available</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
      <div className="relative flex items-center justify-center min-h-64">
        <Image
          src={allUrls[active]}
          alt={alt}
          width={480}
          height={360}
          sizes="(max-width: 767px) calc(100vw - 64px), calc(50vw - 64px)"
          priority
          className="object-contain max-h-72"
        />
      </div>

      {allUrls.length > 1 && (
        <div className="flex gap-2 flex-wrap justify-center">
          {allUrls.map((url, i) => (
            <button
              key={url}
              onClick={() => setActive(i)}
              className={`rounded-lg border-2 overflow-hidden transition-colors ${
                active === i ? 'border-amber-400' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Image
                src={url}
                alt={`${alt} ${i + 1}`}
                width={64}
                height={48}
                className="object-contain w-16 h-12"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
