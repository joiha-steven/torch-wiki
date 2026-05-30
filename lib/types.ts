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
  emitter: string | null
  battery_type: string | null
  battery_count: number | null
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
  is_discontinued: boolean
  created_at: string
  updated_at: string
  reviews?: Review[]
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

export type FilterState = {
  search: string
  categories: string[]
  batteryTypes: string[]
  minLumens: number
  maxLumens: number
  minPrice: number
  maxPrice: number
  chargingType: string | null
  sortBy: string
}
