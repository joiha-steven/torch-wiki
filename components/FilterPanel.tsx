'use client'

import { FilterState } from '@/lib/types'

const CATEGORIES = ['EDC', 'Tactical', 'Weapon Light', 'Thrower', 'Flood', 'Headlamp', 'Search & Rescue', 'Diving', 'Work', 'Custom']

const BATTERY_TYPES = [
  'CR123A', 'D-cell', 'AA', 'AAA',
  '10440', '14500', '16340', '16650', '18350', '18650', '21700', '26650', 'Built-in',
]

const SORT_OPTIONS = [
  { value: 'random',      label: 'Random' },
  { value: 'model_asc',   label: 'Model A–Z' },
  { value: 'lumens_desc', label: 'Lumens (High–Low)' },
  { value: 'lumens_asc',  label: 'Lumens (Low–High)' },
  { value: 'price_asc',   label: 'Price (Low–High)' },
  { value: 'price_desc',  label: 'Price (High–Low)' },
  { value: 'throw_desc',  label: 'Beam Distance (Far–Near)' },
  { value: 'weight_asc',  label: 'Weight (Light–Heavy)' },
]

// Single-select range buckets. Sentinels for "no upper bound": lumens 50000, price 99999.
const LUMEN_MAX = 50000
const PRICE_MAX = 99999
const LUMEN_BUCKETS = [
  { label: '<100',     min: 0,     max: 100 },
  { label: '100–300',  min: 100,   max: 300 },
  { label: '300–600',  min: 300,   max: 600 },
  { label: '600–1000', min: 600,   max: 1000 },
  { label: '1K–2K',    min: 1000,  max: 2000 },
  { label: '2K–5K',    min: 2000,  max: 5000 },
  { label: '5K–10K',   min: 5000,  max: 10000 },
  { label: '>10K',     min: 10000, max: LUMEN_MAX },
]
const PRICE_BUCKETS = [
  { label: '<$50',     min: 0,    max: 50 },
  { label: '$50–100',  min: 50,   max: 100 },
  { label: '$100–200', min: 100,  max: 200 },
  { label: '$200–300', min: 200,  max: 300 },
  { label: '$300–500', min: 300,  max: 500 },
  { label: '$500+',    min: 500,  max: PRICE_MAX },
  { label: '$1K+',     min: 1000, max: PRICE_MAX },
  { label: '$2K+',     min: 2000, max: PRICE_MAX },
  { label: '$3K+',     min: 3000, max: PRICE_MAX },
]

const CHARGING_OPTIONS = [
  { value: null,        label: 'Any' },
  { value: 'usb',       label: 'USB' },
  { value: 'magnetic',  label: 'Magnetic' },
  { value: 'none',      label: 'None' },
]

// Shared section title — sentence case, no caps
const sectionTitle = 'text-[12px] font-semibold text-ink-2 mb-2'

// Shared label wrapper
function CheckRow({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group leading-[1.4]">
      <input type="checkbox" checked={checked} onChange={onChange} className="cb" />
      <span className={`text-[13px] transition-colors ${checked ? 'text-ink font-medium' : 'text-ink-2 group-hover:text-ink'}`}>
        {label}
      </span>
    </label>
  )
}

function RadioRow({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group leading-[1.4]">
      <input type="radio" checked={checked} onChange={onChange} className="rb" />
      <span className={`text-[13px] transition-colors ${checked ? 'text-ink font-medium' : 'text-ink-2 group-hover:text-ink'}`}>
        {label}
      </span>
    </label>
  )
}

// Single-select range-bucket pill group. A bucket sets (min, max); re-clicking
// the active bucket or "Any" resets to (0, resetMax).
function RangeButtons({ buckets, min, max, resetMax, onSelect }: {
  buckets: { label: string; min: number; max: number }[]
  min: number
  max: number
  resetMax: number
  onSelect: (min: number, max: number) => void
}) {
  const isActive = (b: { min: number; max: number }) => min === b.min && max === b.max
  return (
    <div className="flex flex-wrap gap-1.5">
      {buckets.map(b => (
        <button
          key={b.label}
          onClick={() => isActive(b) ? onSelect(0, resetMax) : onSelect(b.min, b.max)}
          className={`glass-pill text-[12px] px-[11px] py-[5px] rounded-full ${isActive(b) ? 'on' : ''}`}
        >
          {b.label}
        </button>
      ))}
      <button
        onClick={() => onSelect(0, resetMax)}
        className={`glass-pill text-[12px] px-[11px] py-[5px] rounded-full ${min === 0 && max === resetMax ? 'on' : ''}`}
      >
        Any
      </button>
    </div>
  )
}

type Props = {
  filters: FilterState
  onChange: (filters: FilterState) => void
  availableBrands: string[]
  availableEmitters: string[]
  availableMadeIn?: string[]
  siteStats?: { flashlights: number; brands: number; users: number }
}

export default function FilterPanel({ filters, onChange, availableBrands, availableEmitters, availableMadeIn = [], siteStats }: Props) {
  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const hasActiveFilters =
    filters.brands.length > 0 ||
    filters.categories.length > 0 ||
    filters.batteryTypes.length > 0 ||
    filters.emitters.length > 0 ||
    filters.madeIn.length > 0 ||
    filters.minLumens > 0 ||
    filters.maxLumens < LUMEN_MAX ||
    filters.minPrice > 0 ||
    filters.maxPrice < PRICE_MAX ||
    filters.chargingType !== null

  const clearAll = () => onChange({ ...filters, brands: [], categories: [], batteryTypes: [], emitters: [], madeIn: [], minLumens: 0, maxLumens: LUMEN_MAX, minPrice: 0, maxPrice: PRICE_MAX, chargingType: null })

  return (
    <aside className="w-[226px] shrink-0 space-y-[18px] text-[13px]">

      {/* Rail head */}
      <div className="flex items-baseline justify-between pb-4">
        <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-ink">Filters</h2>
        {hasActiveFilters && (
          <button onClick={clearAll} className="text-[12px] text-ink-3 hover:text-brand-500 transition-colors">Clear all</button>
        )}
      </div>

      {/* Sort — minimal underline select */}
      <div>
        <p className={sectionTitle}>Sort by</p>
        <select
          value={filters.sortBy}
          onChange={e => onChange({ ...filters, sortBy: e.target.value })}
          className="mini-select w-full text-[13.5px] text-ink py-1.5 cursor-pointer"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Brands */}
      {availableBrands.length > 0 && (
        <div>
          <p className={sectionTitle}>Brand</p>
          <div className="space-y-[3px]">
            {availableBrands.map(brand => (
              <CheckRow
                key={brand}
                checked={filters.brands.includes(brand)}
                onChange={() => onChange({ ...filters, brands: toggle(filters.brands, brand) })}
                label={brand}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lumens */}
      <div>
        <p className={sectionTitle}>
          Lumens{(filters.minLumens > 0 || filters.maxLumens < LUMEN_MAX) && (
            <span className="ml-1.5 text-brand-500 normal-case">
              {LUMEN_BUCKETS.find(b => b.min === filters.minLumens && b.max === filters.maxLumens)?.label ?? ''}
            </span>
          )}
        </p>
        <RangeButtons buckets={LUMEN_BUCKETS} min={filters.minLumens} max={filters.maxLumens} resetMax={LUMEN_MAX}
          onSelect={(min, max) => onChange({ ...filters, minLumens: min, maxLumens: max })} />
      </div>

      {/* Price Range */}
      <div>
        <p className={sectionTitle}>
          Price Range{(filters.minPrice > 0 || filters.maxPrice < PRICE_MAX) && (
            <span className="ml-1.5 text-brand-500 normal-case">
              {PRICE_BUCKETS.find(b => b.min === filters.minPrice && b.max === filters.maxPrice)?.label ?? ''}
            </span>
          )}
        </p>
        <RangeButtons buckets={PRICE_BUCKETS} min={filters.minPrice} max={filters.maxPrice} resetMax={PRICE_MAX}
          onSelect={(min, max) => onChange({ ...filters, minPrice: min, maxPrice: max })} />
      </div>

      {/* Category */}
      <div>
        <p className={sectionTitle}>Category</p>
        <div className="space-y-[3px]">
          {CATEGORIES.map(cat => (
            <CheckRow key={cat} checked={filters.categories.includes(cat)}
              onChange={() => onChange({ ...filters, categories: toggle(filters.categories, cat) })}
              label={cat} />
          ))}
        </div>
      </div>

      {/* Made in */}
      {availableMadeIn.length > 0 && (
        <div>
          <p className={sectionTitle}>Made in</p>
          <div className="space-y-[3px]">
            {availableMadeIn.map(c => (
              <CheckRow key={c} checked={filters.madeIn.includes(c)}
                onChange={() => onChange({ ...filters, madeIn: toggle(filters.madeIn, c) })}
                label={c} />
            ))}
          </div>
        </div>
      )}

      {/* Battery */}
      <div>
        <p className={sectionTitle}>Battery</p>
        <div className="space-y-[3px]">
          {BATTERY_TYPES.map(bt => (
            <CheckRow key={bt} checked={filters.batteryTypes.includes(bt)}
              onChange={() => onChange({ ...filters, batteryTypes: toggle(filters.batteryTypes, bt) })}
              label={bt} />
          ))}
        </div>
      </div>

      {/* Emitters */}
      {availableEmitters.length > 0 && (
        <div>
          <p className={sectionTitle}>LED / Emitter</p>
          <div className="space-y-[3px]">
            {availableEmitters.map(e => (
              <CheckRow key={e} checked={filters.emitters.includes(e)}
                onChange={() => onChange({ ...filters, emitters: toggle(filters.emitters, e) })}
                label={e} />
            ))}
          </div>
        </div>
      )}

      {/* Charging */}
      <div>
        <p className={sectionTitle}>Charging</p>
        <div className="space-y-[3px]">
          {CHARGING_OPTIONS.map(({ value, label }) => (
            <RadioRow key={label} checked={filters.chargingType === value}
              onChange={() => onChange({ ...filters, chargingType: value })}
              label={label} />
          ))}
        </div>
      </div>

      <p className="text-[11px] text-[#b8b8b0] leading-relaxed pt-4 border-t border-line">
        © 2026 torch.edc.wiki — a non-commercial reference project, not affiliated with any brand.{' '}
        Original content &amp; data compilation:{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="hover:text-ink-3 underline underline-offset-2">CC BY 4.0</a>
        {' '}· Code:{' '}
        <a href="https://github.com/joiha-steven/torch-wiki/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="hover:text-ink-3 underline underline-offset-2">MIT</a>
        {' '}·{' '}
        <a href="https://github.com/joiha-steven/torch-wiki" target="_blank" rel="noopener noreferrer" className="hover:text-ink-3 underline underline-offset-2">GitHub</a>.{' '}
        Product specs are factual data; product images belong to their respective manufacturers.
        {siteStats && (
          <> {siteStats.flashlights.toLocaleString()} flashlights · {siteStats.brands} brands · {siteStats.users} users.</>
        )}
      </p>
    </aside>
  )
}
