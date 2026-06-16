import { supabase } from '@/lib/supabase'
import type { FilterState } from '@/lib/types'

// Mobile shows a 2-column grid — load a small first batch so the initial paint
// is light, then let infinite-scroll fill the rest. Desktop loads a full page.
export const PAGE_SIZE_DESKTOP = 32
export const PAGE_SIZE_MOBILE = 16

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  brands: [],
  categories: [],
  batteryTypes: [],
  emitters: [],
  madeIn: [],
  minLumens: 0,
  maxLumens: 50000,
  minPrice: 0,
  maxPrice: 99999,
  chargingType: null,
  sortBy: 'random',
}

// Only the columns the browse card actually renders — never `select('*')`.
// Spec/filter-only columns (emitters, weight_g, charging_type, year, …) are
// filtered server-side and don't need to travel to the client. This is what
// keeps the browse payload light (was ~2MB decoded with select('*')).
export const BROWSE_COLS =
  'id,slug,brand,model,image_url,max_lumens,beam_distance_m,category,price_usd,is_discontinued,battery_options,battery_type,battery_count'

export type BrandMeta = { name: string; made_in: string | null }
export type SiteStats = { flashlights: number; brands: number; users: number }
export type BrowseMeta = {
  brands: string[]
  emitters: string[]
  brandsMeta: BrandMeta[]
  stats: SiteStats
}

// madeInBrands: when the "Made in" filter is active, the precomputed list of brand
// names whose made_in matches the selection (made_in lives on the brands table).
export function buildQuery(
  filters: FilterState,
  from: number,
  to: number,
  madeInBrands: string[] | null = null,
) {
  // `exact` count — the table is small (~hundreds of rows) so a real COUNT is
  // cheap, and an accurate total is REQUIRED for infinite scroll: `hasMore` is
  // `items.length < totalCount`, and a low planner estimate (`estimated`/`planned`,
  // common right after a bulk insert before ANALYZE) made the grid stop loading
  // early even when more results existed.
  let q = supabase.from('flashlights').select(BROWSE_COLS, { count: 'exact' })

  if (filters.brands.length > 0) q = q.in('brand', filters.brands)
  if (madeInBrands !== null) q = q.in('brand', madeInBrands)
  if (filters.categories.length > 0) q = q.in('category', filters.categories)
  if (filters.batteryTypes.length > 0) q = q.overlaps('battery_types', filters.batteryTypes)
  if (filters.emitters.length > 0) q = q.overlaps('emitters', filters.emitters)
  if (filters.minLumens > 0) q = q.gte('max_lumens', filters.minLumens)
  if (filters.maxLumens < 50000) q = q.lte('max_lumens', filters.maxLumens)
  if (filters.minPrice > 0) q = q.gte('price_usd', filters.minPrice)
  if (filters.maxPrice < 99999) q = q.lte('price_usd', filters.maxPrice)
  if (filters.chargingType !== null) q = q.eq('charging_type', filters.chargingType)
  if (filters.search.trim()) {
    // Split into words — each word must match brand OR model (AND between words)
    // "surefire 6px" → (brand|model has "surefire") AND (brand|model has "6px")
    const words = filters.search.trim().split(/\s+/).filter(Boolean)
    for (const word of words) {
      q = q.or(`model.ilike.%${word}%,brand.ilike.%${word}%`)
    }
  }

  switch (filters.sortBy) {
    // Order by the random sort_seed column (reshuffled nightly by a pg_cron job)
    // with id as a deterministic tie-break so infinite-scroll pages don't overlap.
    case 'random':      q = q.order('sort_seed', { ascending: true }).order('id', { ascending: true }); break
    case 'lumens_desc': q = q.order('max_lumens', { ascending: false, nullsFirst: false }); break
    case 'lumens_asc':  q = q.order('max_lumens', { ascending: true,  nullsFirst: false }); break
    case 'price_asc':   q = q.order('price_usd',  { ascending: true,  nullsFirst: false }); break
    case 'price_desc':  q = q.order('price_usd',  { ascending: false, nullsFirst: false }); break
    case 'throw_desc':  q = q.order('beam_distance_m', { ascending: false, nullsFirst: false }); break
    case 'weight_asc':  q = q.order('weight_g',   { ascending: true,  nullsFirst: false }); break
    default:            q = q.order('model', { ascending: true })
  }

  return q.range(from, to)
}

// Lightweight per-row facet data (just the filterable columns, all rows) used to
// compute which filter options still yield results given the active filters, so
// zero-result options can be hidden. The table is small, so loading every row's
// few facet columns once (after first paint) is cheap and lets the rail update
// instantly client-side with no query per filter change.
export type FacetRow = {
  brand: string | null
  category: string | null
  battery_types: string[] | null
  emitters: string[] | null
  max_lumens: number | null
  price_usd: number | null
  charging_type: string | null
}
export async function fetchFacetRows(): Promise<FacetRow[]> {
  const { data } = await supabase
    .from('flashlights')
    .select('brand,category,battery_types,emitters,max_lumens,price_usd,charging_type')
  return (data ?? []) as FacetRow[]
}

// Resolve the "Made in" filter (a brands-table attribute) to the set of brand names to match on.
// Returns null when the filter is inactive (no constraint).
export function madeInBrandNames(filters: FilterState, brandsMeta: BrandMeta[]): string[] | null {
  if (filters.madeIn.length === 0) return null
  return brandsMeta.filter(b => b.made_in && filters.madeIn.includes(b.made_in)).map(b => b.name)
}

// Filter lists + site counts. Runs on the server (next to the DB) for the first
// paint; also used as a client fallback. Small tables → `exact` counts are cheap
// and the headline "X flashlights" number stays correct.
export async function fetchBrowseMeta(): Promise<BrowseMeta> {
  const [{ data: b }, { data: e }, { data: br }, { count: fCount }, { count: uCount }] = await Promise.all([
    supabase.rpc('get_distinct_brands'),
    supabase.rpc('get_distinct_emitters'),
    supabase.from('brands').select('name, made_in'),
    supabase.from('flashlights').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ])
  const brands = (b ?? []).map((r: { brand: string }) => r.brand).filter(Boolean) as string[]
  const emitters = (e ?? []).map((r: { emitter: string }) => r.emitter).filter(Boolean) as string[]
  const brandsMeta = (br ?? []) as BrandMeta[]
  return {
    brands,
    emitters,
    brandsMeta,
    stats: { flashlights: fCount ?? 0, brands: brands.length, users: uCount ?? 0 },
  }
}
