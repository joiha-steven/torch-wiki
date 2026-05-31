'use client'

import { FilterState } from '@/lib/types'

const CATEGORIES = ['EDC', 'Tactical', 'Weapon Light', 'Thrower', 'Flood', 'Headlamp', 'Search & Rescue', 'Work', 'Custom']

const BATTERY_TYPES = [
  // Single-use / primary
  'CR123A', 'D-cell', 'AA', 'AAA',
  // Rechargeable, small to large
  '10440', '14500', '18350', '18650', '21700', '26650', 'Built-in',
]

const SORT_OPTIONS = [
  { value: 'model_asc', label: 'Model A–Z' },
  { value: 'lumens_desc', label: 'Lumens (High–Low)' },
  { value: 'lumens_asc', label: 'Lumens (Low–High)' },
  { value: 'price_asc', label: 'Price (Low–High)' },
  { value: 'price_desc', label: 'Price (High–Low)' },
  { value: 'throw_desc', label: 'Beam Distance (Far–Near)' },
  { value: 'weight_asc', label: 'Weight (Light–Heavy)' },
]

const LUMEN_STEPS = [100, 300, 500, 800, 1000, 2000, 5000, 10000]
const PRICE_STEPS = [50, 100, 200, 300, 500, 800, 1000, 2000, 3000, 5000, 10000]

const CHARGING_OPTIONS = [
  { value: null, label: 'Any' },
  { value: 'usb', label: 'USB' },
  { value: 'magnetic', label: 'Magnetic' },
  { value: 'none', label: 'None' },
]

type Props = {
  filters: FilterState
  onChange: (filters: FilterState) => void
  totalCount: number
  availableBrands: string[]
  availableEmitters: string[]
}

function StepButtons({ steps, value, maxSentinel, onChange }: {
  steps: number[]
  value: number
  maxSentinel: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {steps.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s === value ? maxSentinel : s)}
          className={`px-2 py-0.5 rounded text-xs border transition-colors ${
            value === s
              ? 'bg-brand-500 border-brand-500 text-white'
              : 'border-slate-200 text-slate-600 hover:border-brand-300'
          }`}
        >
          {s >= 1000 ? `${s / 1000}K` : s}
        </button>
      ))}
      <button
        onClick={() => onChange(maxSentinel)}
        className={`px-2 py-0.5 rounded text-xs border transition-colors ${
          value === maxSentinel
            ? 'bg-brand-500 border-brand-500 text-white'
            : 'border-slate-200 text-slate-600 hover:border-brand-300'
        }`}
      >
        Any
      </button>
    </div>
  )
}

export default function FilterPanel({ filters, onChange, totalCount, availableBrands, availableEmitters }: Props) {
  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]

  const hasActiveFilters =
    filters.brands.length > 0 ||
    filters.categories.length > 0 ||
    filters.batteryTypes.length > 0 ||
    filters.emitters.length > 0 ||
    filters.maxLumens < 50000 ||
    filters.minPrice > 0 ||
    filters.maxPrice < 99999 ||
    filters.chargingType !== null

  return (
    <aside className="w-56 shrink-0 space-y-5">
      <div>
        <p className="text-sm font-semibold text-slate-600 mb-2">Sort by</p>
        <select
          value={filters.sortBy}
          onChange={(e) => onChange({ ...filters, sortBy: e.target.value })}
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {availableBrands.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-600 mb-2">Brand</p>
          <div className="space-y-1.5">
            {availableBrands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.brands.includes(brand)}
                  onChange={() => onChange({ ...filters, brands: toggle(filters.brands, brand) })}
                  className="accent-brand-500"
                />
                {brand}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-slate-600 mb-2">
          Max Lumens {filters.maxLumens < 50000 && <span className="text-brand-600 normal-case font-bold">≤{filters.maxLumens >= 1000 ? `${filters.maxLumens / 1000}K` : filters.maxLumens}</span>}
        </p>
        <StepButtons
          steps={LUMEN_STEPS}
          value={filters.maxLumens}
          maxSentinel={50000}
          onChange={(v) => onChange({ ...filters, maxLumens: v })}
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-600 mb-2">
          Min Price {filters.minPrice > 0 && <span className="text-brand-600 normal-case font-bold">≥${filters.minPrice}</span>}
        </p>
        <StepButtons
          steps={PRICE_STEPS}
          value={filters.minPrice}
          maxSentinel={0}
          onChange={(v) => onChange({ ...filters, minPrice: v })}
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-600 mb-2">
          Max Price {filters.maxPrice < 99999 && <span className="text-brand-600 normal-case font-bold">≤${filters.maxPrice}</span>}
        </p>
        <StepButtons
          steps={PRICE_STEPS}
          value={filters.maxPrice}
          maxSentinel={99999}
          onChange={(v) => onChange({ ...filters, maxPrice: v })}
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-600 mb-2">Category</p>
        <div className="space-y-1.5">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.categories.includes(cat)}
                onChange={() => onChange({ ...filters, categories: toggle(filters.categories, cat) })}
                className="accent-brand-500"
              />
              {cat}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-600 mb-2">Battery Type</p>
        <div className="space-y-1.5">
          {BATTERY_TYPES.map((bt) => (
            <label key={bt} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.batteryTypes.includes(bt)}
                onChange={() => onChange({ ...filters, batteryTypes: toggle(filters.batteryTypes, bt) })}
                className="accent-brand-500"
              />
              {bt}
            </label>
          ))}
        </div>
      </div>

      {availableEmitters.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-600 mb-2">LED / Emitter</p>
          <div className="space-y-1.5">
            {availableEmitters.map((emitter) => (
              <label key={emitter} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.emitters.includes(emitter)}
                  onChange={() => onChange({ ...filters, emitters: toggle(filters.emitters, emitter) })}
                  className="accent-brand-500"
                />
                {emitter}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-slate-600 mb-2">Charging</p>
        <div className="space-y-1.5">
          {CHARGING_OPTIONS.map(({ value, label }) => (
            <label key={label} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="radio"
                checked={filters.chargingType === value}
                onChange={() => onChange({ ...filters, chargingType: value })}
                className="accent-brand-500"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={() => onChange({
            ...filters,
            brands: [],
            categories: [],
            batteryTypes: [],
            emitters: [],
            maxLumens: 50000,
            minPrice: 0,
            maxPrice: 99999,
            chargingType: null,
          })}
          className="w-full text-xs text-red-500 hover:text-red-700 py-1"
        >
          Clear all filters
        </button>
      )}

      <p className="text-xs text-slate-400">{totalCount} results</p>

      <p className="text-xs text-slate-400 leading-relaxed pt-3 border-t border-slate-100">
        All specs and images belong to their respective brands. Non-commercial, no ads, no profit.{' '}
        <a href="https://github.com/joiha-steven/torch-wiki" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline underline-offset-2">GitHub</a>
      </p>
    </aside>
  )
}
