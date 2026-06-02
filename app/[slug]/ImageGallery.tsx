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
    ...extraImages.map(img => img.url),
  ]

  const [active, setActive] = useState(0)

  if (allUrls.length === 0) {
    return (
      <div className="bg-[#f6f6f3] rounded-2xl flex items-center justify-center min-h-72">
        <span className="text-[#c8c8c0] text-sm">No image</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative bg-white rounded-2xl overflow-hidden flex items-center justify-center" style={{ minHeight: '320px' }}>
        <Image
          src={allUrls[active]}
          alt={alt}
          width={500}
          height={380}
          sizes="(max-width: 767px) calc(100vw - 48px), calc(50vw - 80px)"
          priority
          className="object-contain p-8 w-full"
          style={{ maxHeight: '360px' }}
        />
      </div>

      {/* Thumbnails */}
      {allUrls.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {allUrls.map((url, i) => (
            <button
              key={url}
              onClick={() => setActive(i)}
              className={`rounded-xl overflow-hidden border-2 transition-colors bg-white ${
                active === i
                  ? 'border-brand-500'
                  : 'border-[#e7e7e1] hover:border-[#c8c8c0]'
              }`}
            >
              <Image
                src={url}
                alt={`${alt} ${i + 1}`}
                width={72}
                height={56}
                className="object-contain w-[72px] h-14 p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
