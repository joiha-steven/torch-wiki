export type BatteryOption = {
  type: string
  count: number
}

export type FlashlightImage = {
  id: string
  flashlight_id: string
  url: string
  sort_order: number
  created_at: string
}

export type Flashlight = {
  id: string
  brand: string
  model: string
  slug: string
  year: number | null
  price_usd: number | null
  buy_url: string | null
  max_lumens: number | null
  min_lumens: number | null
  beam_distance_m: number | null
  beam_type: string | null
  emitter: string | null  // legacy text field — use emitters[] for display/filter
  emitters: string[]
  battery_type: string | null    // legacy single value — use battery_options/battery_types
  battery_count: number | null   // legacy single value — count of battery_type
  battery_types: string[]        // canonical: distinct battery sizes, used for filtering
  battery_options: BatteryOption[]  // canonical: per-type cell count, e.g. 2×18350 OR 1×18650
  has_usb_charging: boolean
  charging_type: string | null
  length_mm: number | null
  head_diameter_mm: number | null
  body_diameter_mm: number | null
  weight_g: number | null
  material: string | null
  ip_rating: string | null
  impact_resistance_m: number | null
  category: string | null
  image_url: string | null
  description: string | null
  notes: string | null
  manual_url: string | null       // legacy single PDF — prefer manual_urls
  manual_urls: string[] | null    // multiple PDFs: manual.pdf, manual-1.pdf, …
  is_discontinued: boolean
  created_at: string
  updated_at: string
  reviews?: Review[]
  flashlight_images?: FlashlightImage[]
}

export type Review = {
  id: string
  flashlight_id: string
  title: string
  reviewer: string | null
  url: string
  type: string | null
  summary: string | null
  created_at: string
}

export type CollectionItem = {
  id: string
  user_id: string
  flashlight_id: string
  created_at: string
  purchase_price: number | null
  material: string | null
  color: string | null
  purchase_date: string | null
  quantity: number
  flashlights: Flashlight
}

export type WishlistItem = {
  id: string
  user_id: string
  flashlight_id: string
  created_at: string
  flashlights: Flashlight
}

export type SubmissionImage = {
  id: string
  submission_id: string
  url: string
  sort_order: number
  is_primary: boolean
  created_at: string
}

export type FlashlightSubmission = {
  id: string
  user_id: string
  type: 'new' | 'edit'
  status: 'pending' | 'approved' | 'rejected'
  target_id: string | null
  data: Partial<Flashlight>
  note: string | null
  reviewer_note: string | null
  created_at: string
  reviewed_at: string | null
  submission_images?: SubmissionImage[]
  flashlights?: Flashlight | null         // joined for edit — the original
}

export type FilterState = {
  search: string
  brands: string[]
  categories: string[]
  batteryTypes: string[]
  emitters: string[]
  minLumens: number
  maxLumens: number
  minPrice: number
  maxPrice: number
  chargingType: string | null
  sortBy: string
}
