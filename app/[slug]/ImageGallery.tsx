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
      <div className="glass rounded-[18px] flex items-center justify-center aspect-[3/2]">
        <span className="text-[#9b9b94] text-sm">No image</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3.5">
      {/* Main image — glass hero */}
      <div className="glass relative rounded-[18px] overflow-hidden flex items-center justify-center aspect-[3/2]">
        <Image
          src={allUrls[active]}
          alt={alt}
          width={500}
          height={380}
          sizes="(max-width: 767px) calc(100vw - 48px), calc(50vw - 80px)"
          priority
          className="object-contain p-8 w-full h-full"
        />
      </div>

      {/* Thumbnails — glass tiles */}
      {allUrls.length > 1 && (
        <div className="flex gap-2.5 flex-wrap">
          {allUrls.map((url, i) => (
            <button
              key={url}
              onClick={() => setActive(i)}
              className={`glass-2 w-[66px] h-[66px] grid place-items-center rounded-[12px] overflow-hidden transition-colors ${
                active === i ? '!border-brand-500' : 'hover:!border-white'
              }`}
            >
              <Image
                src={url}
                alt={`${alt} ${i + 1}`}
                width={64}
                height={64}
                className="object-contain w-full h-full p-1.5"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
