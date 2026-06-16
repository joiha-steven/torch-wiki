'use client'

import { FilterState } from '@/lib/types'
import { CATEGORIES, BATTERY_TYPES } from '@/lib/constants'

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

// Sentinels for "no upper bound": lumens 50000, price 99999 (buildQuery drops the
// lte when the max sits at the sentinel). The price slider uses a soft display
// cap of 3000 - the top thumb means "$3000+" and maps to the no-bound sentinel.
const LUMEN_MAX = 50000
const PRICE_MAX = 99999
const PRICE_CEIL = 3000

const CHARGING_OPTIONS = [
  { value: null,        label: 'Any' },
  { value: 'usb',       label: 'USB' },
  { value: 'magnetic',  label: 'Magnetic' },
  { value: 'none',      label: 'None' },
]

// Shared section title - sentence case, no caps
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

// Dual-thumb range slider. Operates in display units [floor, ceil]; the parent
// maps the ceil thumb to the no-bound sentinel. Two overlaid range inputs with a
// highlighted segment between the thumbs.
function RangeSlider({ floor, ceil, step, lo, hi, onChange, format }: {
  floor: number
  ceil: number
  step: number
  lo: number
  hi: number
  onChange: (lo: number, hi: number) => void
  format: (v: number) => string
}) {
  const pct = (v: number) => ((v - floor) / (ceil - floor)) * 100
  const loP = pct(lo)
  const hiP = pct(hi)
  return (
    <div>
      <div className="flex justify-between text-[12.5px] font-medium text-ink-2 mb-2.5">
        <span>{format(lo)}</span>
        <span>{format(hi)}</span>
      </div>
      <div className="dual-range relative h-4">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-line" />
        <div className="absolute top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-brand-500"
          style={{ left: `${loP}%`, right: `${100 - hiP}%` }} />
        {/* lo thumb - raise above the hi input near the top end so it stays grabbable */}
        <input
          type="range" min={floor} max={ceil} step={step} value={lo}
          onChange={e => onChange(Math.min(Number(e.target.value), hi), hi)}
          style={{ zIndex: loP > 75 ? 5 : 3 }}
          aria-label="Minimum"
        />
        <input
          type="range" min={floor} max={ceil} step={step} value={hi}
          onChange={e => onChange(lo, Math.max(Number(e.target.value), lo))}
          style={{ zIndex: 4 }}
          aria-label="Maximum"
        />
      </div>
    </div>
  )
}

type Props = {
  filters: FilterState
  onChange: (filters: FilterState) => void
  availableBrands: string[]
  availableEmitters: string[]
  availableMadeIn?: string[]
  // Allowed sets for the hardcoded groups, narrowed by the active filters so
  // zero-result options are hidden. Undefined = facet data not loaded → show all.
  availableCategories?: string[]
  availableBatteryTypes?: string[]
}

export default function FilterPanel({ filters, onChange, availableBrands, availableEmitters, availableMadeIn = [], availableCategories, availableBatteryTypes }: Props) {
  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  // Hide options with no results (keep any currently-selected one so it can be
  // unchecked). Before facet data loads the lists are undefined → show everything.
  const categories = availableCategories
    ? CATEGORIES.filter(c => availableCategories.includes(c) || filters.categories.includes(c))
    : CATEGORIES
  const batteryTypes = availableBatteryTypes
    ? BATTERY_TYPES.filter(b => availableBatteryTypes.includes(b) || filters.batteryTypes.includes(b))
    : BATTERY_TYPES

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

      {/* Sort - minimal underline select */}
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
        <p className={sectionTitle}>Lumens</p>
        <RangeSlider
          floor={0} ceil={LUMEN_MAX} step={100}
          lo={filters.minLumens} hi={Math.min(filters.maxLumens, LUMEN_MAX)}
          onChange={(lo, hi) => onChange({ ...filters, minLumens: lo, maxLumens: hi })}
          format={v => `${v.toLocaleString()}${v >= LUMEN_MAX ? '+' : ''}`}
        />
      </div>

      {/* Price Range */}
      <div>
        <p className={sectionTitle}>Price</p>
        <RangeSlider
          floor={0} ceil={PRICE_CEIL} step={25}
          lo={filters.minPrice} hi={Math.min(filters.maxPrice, PRICE_CEIL)}
          onChange={(lo, hi) => onChange({ ...filters, minPrice: lo, maxPrice: hi >= PRICE_CEIL ? PRICE_MAX : hi })}
          format={v => `$${v.toLocaleString()}${v >= PRICE_CEIL ? '+' : ''}`}
        />
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <div>
          <p className={sectionTitle}>Category</p>
          <div className="space-y-[3px]">
            {categories.map(cat => (
              <CheckRow key={cat} checked={filters.categories.includes(cat)}
                onChange={() => onChange({ ...filters, categories: toggle(filters.categories, cat) })}
                label={cat} />
            ))}
          </div>
        </div>
      )}

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
      {batteryTypes.length > 0 && (
        <div>
          <p className={sectionTitle}>Battery</p>
          <div className="space-y-[3px]">
            {batteryTypes.map(bt => (
              <CheckRow key={bt} checked={filters.batteryTypes.includes(bt)}
                onChange={() => onChange({ ...filters, batteryTypes: toggle(filters.batteryTypes, bt) })}
                label={bt} />
            ))}
          </div>
        </div>
      )}

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
        © 2026 torch.edc.wiki - a non-commercial reference project, not affiliated with any brand.{' '}
        Original content &amp; data compilation:{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="hover:text-ink-3 underline underline-offset-2">CC BY 4.0</a>
        {' '}· Code:{' '}
        <a href="https://github.com/joiha-steven/torch-wiki/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="hover:text-ink-3 underline underline-offset-2">MIT</a>
        {' '}·{' '}
        <a href="https://github.com/joiha-steven/torch-wiki" target="_blank" rel="noopener noreferrer" className="hover:text-ink-3 underline underline-offset-2">GitHub</a>.{' '}
        Product specs are factual data; product images belong to their respective manufacturers.
      </p>
    </aside>
  )
}
