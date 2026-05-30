'use client'

import { FilterState } from '@/lib/types'

const CATEGORIES = ['EDC', 'Tactical', 'Thrower', 'Flood', 'Headlamp', 'Search & Rescue', 'Work', 'Custom']

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
const PRICE_STEPS = [50, 100, 200, 300, 500, 800, 1000, 2000, 3000]

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
              ? 'bg-amber-500 border-amber-500 text-white'
              : 'border-slate-200 text-slate-600 hover:border-amber-300'
          }`}
        >
          {s >= 1000 ? `${s / 1000}K` : s}
        </button>
      ))}
      <button
        onClick={() => onChange(maxSentinel)}
        className={`px-2 py-0.5 rounded text-xs border transition-colors ${
          value === maxSentinel
            ? 'bg-amber-500 border-amber-500 text-white'
            : 'border-slate-200 text-slate-600 hover:border-amber-300'
        }`}
      >
        Any
      </button>
    </div>
  )
}

export default function FilterPanel({ filters, onChange, totalCount }: Props) {
  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.batteryTypes.length > 0 ||
    filters.maxLumens < 50000 ||
    filters.maxPrice < 99999 ||
    filters.chargingType !== null

  return (
    <aside className="w-56 shrink-0 space-y-5">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Sort by</p>
        <select
          value={filters.sortBy}
          onChange={(e) => onChange({ ...filters, sortBy: e.target.value })}
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Max Lumens {filters.maxLumens < 50000 && <span className="text-amber-600 normal-case font-bold">≤{filters.maxLumens >= 1000 ? `${filters.maxLumens / 1000}K` : filters.maxLumens}</span>}
        </p>
        <StepButtons
          steps={LUMEN_STEPS}
          value={filters.maxLumens}
          maxSentinel={50000}
          onChange={(v) => onChange({ ...filters, maxLumens: v })}
        />
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Max Price {filters.maxPrice < 99999 && <span className="text-amber-600 normal-case font-bold">≤${filters.maxPrice}</span>}
        </p>
        <StepButtons
          steps={PRICE_STEPS}
          value={filters.maxPrice}
          maxSentinel={99999}
          onChange={(v) => onChange({ ...filters, maxPrice: v })}
        />
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Category</p>
        <div className="space-y-1.5">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.categories.includes(cat)}
                onChange={() => onChange({ ...filters, categories: toggle(filters.categories, cat) })}
                className="accent-amber-500"
              />
              {cat}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Battery Type</p>
        <div className="space-y-1.5">
          {BATTERY_TYPES.map((bt) => (
            <label key={bt} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.batteryTypes.includes(bt)}
                onChange={() => onChange({ ...filters, batteryTypes: toggle(filters.batteryTypes, bt) })}
                className="accent-amber-500"
              />
              {bt}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Charging</p>
        <div className="space-y-1.5">
          {CHARGING_OPTIONS.map(({ value, label }) => (
            <label key={label} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="radio"
                checked={filters.chargingType === value}
                onChange={() => onChange({ ...filters, chargingType: value })}
                className="accent-amber-500"
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
            categories: [],
            batteryTypes: [],
            maxLumens: 50000,
            maxPrice: 2000,
            chargingType: null,
          })}
          className="w-full text-xs text-red-500 hover:text-red-700 py-1"
        >
          Clear all filters
        </button>
      )}

      <p className="text-xs text-slate-400">{totalCount} results</p>
    </aside>
  )
}
