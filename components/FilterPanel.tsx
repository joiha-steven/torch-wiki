'use client'

import { FilterState } from '@/lib/types'

const CATEGORIES = ['EDC', 'Tactical', 'Weapon Light', 'Thrower', 'Flood', 'Headlamp', 'Search & Rescue', 'Diving', 'Work', 'Custom']

const BATTERY_TYPES = [
  'CR123A', 'D-cell', 'AA', 'AAA',
  '10440', '14500', '16340', '18350', '18650', '21700', '26650', 'Built-in',
]

const SORT_OPTIONS = [
  { value: 'model_asc',   label: 'Model A–Z' },
  { value: 'lumens_desc', label: 'Lumens (High–Low)' },
  { value: 'lumens_asc',  label: 'Lumens (Low–High)' },
  { value: 'price_asc',   label: 'Price (Low–High)' },
  { value: 'price_desc',  label: 'Price (High–Low)' },
  { value: 'throw_desc',  label: 'Beam Distance (Far–Near)' },
  { value: 'weight_asc',  label: 'Weight (Light–Heavy)' },
]

const LUMEN_STEPS = [100, 300, 500, 800, 1000, 2000, 5000, 10000]
const PRICE_STEPS = [50, 100, 200, 300, 500, 800, 1000, 2000, 3000, 5000, 10000]

const CHARGING_OPTIONS = [
  { value: null,        label: 'Any' },
  { value: 'usb',       label: 'USB' },
  { value: 'magnetic',  label: 'Magnetic' },
  { value: 'none',      label: 'None' },
]

// Shared section title — sentence case, no caps
const sectionTitle = 'text-[12px] font-semibold text-[#6c6c66] mb-2'

// Shared label wrapper
function CheckRow({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group leading-[1.4]">
      <input type="checkbox" checked={checked} onChange={onChange} className="cb" />
      <span className={`text-[13px] transition-colors ${checked ? 'text-[#17171a] font-medium' : 'text-[#6c6c66] group-hover:text-[#17171a]'}`}>
        {label}
      </span>
    </label>
  )
}

function RadioRow({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group leading-[1.4]">
      <input type="radio" checked={checked} onChange={onChange} className="rb" />
      <span className={`text-[13px] transition-colors ${checked ? 'text-[#17171a] font-medium' : 'text-[#6c6c66] group-hover:text-[#17171a]'}`}>
        {label}
      </span>
    </label>
  )
}

// Single-select glass pill group
function StepButtons({ steps, value, maxSentinel, onChange, format }: {
  steps: number[]
  value: number
  maxSentinel: number
  onChange: (v: number) => void
  format?: (n: number) => string
}) {
  const fmt = format ?? ((n: number) => n >= 1000 ? `${n / 1000}K` : String(n))
  return (
    <div className="flex flex-wrap gap-1.5">
      {steps.map(s => (
        <button
          key={s}
          onClick={() => onChange(s === value ? maxSentinel : s)}
          className={`glass-pill text-[12px] px-[11px] py-[5px] rounded-full ${value === s ? 'on' : ''}`}
        >
          {fmt(s)}
        </button>
      ))}
      <button
        onClick={() => onChange(maxSentinel)}
        className={`glass-pill text-[12px] px-[11px] py-[5px] rounded-full ${value === maxSentinel ? 'on' : ''}`}
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
    filters.maxLumens < 50000 ||
    filters.minPrice > 0 ||
    filters.maxPrice < 99999 ||
    filters.chargingType !== null

  const clearAll = () => onChange({ ...filters, brands: [], categories: [], batteryTypes: [], emitters: [], madeIn: [], maxLumens: 50000, minPrice: 0, maxPrice: 99999, chargingType: null })

  return (
    <aside className="w-[226px] shrink-0 space-y-[18px] text-[13px]">

      {/* Rail head */}
      <div className="flex items-baseline justify-between pb-4">
        <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-[#17171a]">Filters</h2>
        {hasActiveFilters && (
          <button onClick={clearAll} className="text-[12px] text-[#9b9b94] hover:text-brand-500 transition-colors">Clear all</button>
        )}
      </div>

      {/* Sort — minimal underline select */}
      <div>
        <p className={sectionTitle}>Sort by</p>
        <select
          value={filters.sortBy}
          onChange={e => onChange({ ...filters, sortBy: e.target.value })}
          className="mini-select w-full text-[13.5px] text-[#17171a] py-1.5 cursor-pointer"
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

      {/* Max Lumens */}
      <div>
        <p className={sectionTitle}>
          Max Lumens{filters.maxLumens < 50000 && (
            <span className="ml-1.5 text-brand-500 normal-case">
              ≤{filters.maxLumens >= 1000 ? `${filters.maxLumens / 1000}K` : filters.maxLumens}
            </span>
          )}
        </p>
        <StepButtons steps={LUMEN_STEPS} value={filters.maxLumens} maxSentinel={50000}
          onChange={v => onChange({ ...filters, maxLumens: v })} />
      </div>

      {/* Price Range */}
      <div>
        <p className={sectionTitle}>
          Price Range
          {(filters.minPrice > 0 || filters.maxPrice < 99999) && (
            <span className="ml-1.5 text-brand-500 normal-case">
              {filters.minPrice > 0 ? `$${filters.minPrice}` : ''}{filters.minPrice > 0 && filters.maxPrice < 99999 ? '–' : ''}{filters.maxPrice < 99999 ? `$${filters.maxPrice}` : ''}
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[50, 150, 500].map(v => {
            const label = v === 50 ? '<$50' : v === 150 ? '$50–150' : '$150–500'
            const active = filters.maxPrice === v
            return (
              <button key={v} onClick={() => onChange({ ...filters, maxPrice: active ? 99999 : v, minPrice: 0 })}
                className={`glass-pill text-[12px] px-[11px] py-[5px] rounded-full ${active ? 'on' : ''}`}>
                {label}
              </button>
            )
          })}
          {[500, 1000, 2000].map(v => {
            const active = filters.minPrice === v
            return (
              <button key={v} onClick={() => onChange({ ...filters, minPrice: active ? 0 : v, maxPrice: 99999 })}
                className={`glass-pill text-[12px] px-[11px] py-[5px] rounded-full ${active ? 'on' : ''}`}>
                ${v >= 1000 ? `${v / 1000}K` : v}+
              </button>
            )
          })}
          <button onClick={() => onChange({ ...filters, minPrice: 0, maxPrice: 99999 })}
            className={`glass-pill text-[12px] px-[11px] py-[5px] rounded-full ${filters.minPrice === 0 && filters.maxPrice === 99999 ? 'on' : ''}`}>
            Any
          </button>
        </div>
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

      <p className="text-[11px] text-[#b8b8b0] leading-relaxed pt-4 border-t border-[#e7e7e1]">
        All specs and images belong to their respective brands. Non-commercial.{' '}
        <a href="https://github.com/joiha-steven/torch-wiki" target="_blank" rel="noopener noreferrer" className="hover:text-slate-500 underline underline-offset-2">GitHub</a>.
        {siteStats && (
          <> Currently {siteStats.flashlights.toLocaleString()} flashlights · {siteStats.brands} brands · {siteStats.users} users.</>
        )}
      </p>
    </aside>
  )
}
