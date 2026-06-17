export type BatteryOption = {
  type: string
  count: number
}

// Structured material: base material + finish + colour (or, for Damasteel, the
// "colour" slot holds the etch state). Up to 3 per flashlight. See lib/materials.ts.
export type MaterialEntry = {
  material: string
  finish: string | null
  color: string | null
}

export type Brand = {
  name: string
  country: string | null   // where the brand is from, e.g. China, USA, Germany
  made_in: string | null   // where its products are manufactured
  founded_year?: number | null   // year the company / maker was founded
  headquarters?: string | null   // city / region of HQ
  website?: string | null         // official site URL
  about?: string | null           // company / maker bio — Markdown
  logo_url?: string | null        // optional brand logo (Vercel Blob)
  created_at?: string
  updated_by?: string | null      // auth.users id of last editor (null = system/seed)
  updated_at?: string | null      // last edit time
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
  candela: number | null          // beam intensity (cd); throw ≈ 2·√candela
  beam_type: string | null
  emitter: string | null  // legacy text field — use emitters[] for display/filter
  emitters: string[]
  led_count: number | null        // number of emitters / LEDs
  driver_type: string | null      // e.g. Buck, Boost, Buck-Boost, FET, Linear
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
  material: string | null            // legacy free-text (kept as display fallback)
  materials?: MaterialEntry[] | null // canonical structured materials (up to 3)
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
  published_at: string | null   // when the review article/video was posted
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
  type: 'new' | 'edit' | 'delete'
  status: 'pending' | 'approved' | 'rejected'
  target_id: string | null
  data: Partial<Flashlight>
  note: string | null
  reviewer_note: string | null
  created_at: string
  reviewed_at: string | null
  submission_images?: SubmissionImage[]
  flashlights?: Flashlight | null         // joined for edit — the original
  submitter_nickname?: string | null      // resolved by the admin GET (who filed it)
}

export type FilterState = {
  search: string
  brands: string[]
  categories: string[]
  batteryTypes: string[]
  emitters: string[]
  madeIn: string[]
  minLumens: number
  maxLumens: number
  minPrice: number
  maxPrice: number
  chargingType: string | null
  sortBy: string
}
