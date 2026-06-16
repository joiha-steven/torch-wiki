import React from 'react'

export { CATEGORIES, BATTERY_TYPES } from '@/lib/constants'
export const BEAM_TYPES = ['Spot', 'Flood', 'Spot+Flood', 'Thrower']
export const CHARGING_TYPES = ['usb', 'magnetic', 'none']

export const input = "w-full h-10 text-sm border border-line rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-panel"

export type ImageEntry = {
  id: string           // 'existing-primary' | 'existing-{dbId}' | uuid for new
  url: string          // Vercel Blob URL for existing, object URL for new
  file?: File          // only for new images
  isPrimary: boolean
  uploading: boolean
  isExisting: boolean  // already stored in DB
  existingDbId?: string // flashlight_images.id (for extras)
}

export type ReviewRow = {
  url: string
  title: string
  published_at: string | null   // ISO date
  type: string | null           // 'video' | 'article'
  fetching?: boolean
}

export function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-2 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
