'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
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

// Collapsible facet group (native <details>, 0-JS). `count` shows how many options
// in the group are active so a collapsed section still signals it's filtering.
function Section({ title, count = 0, defaultOpen, children }: {
  title: string
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  return (
    <details className="group border-b border-line pb-3" open={defaultOpen}>
      <summary className="flex items-center justify-between cursor-pointer select-none list-none py-0.5 [&::-webkit-details-marker]:hidden">
        <span className="text-[12px] font-semibold text-ink-2">
          {title}{count > 0 && <span className="ml-1.5 text-brand-500">{count}</span>}
        </span>
        <ChevronDown size={14} className="text-ink-3 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-2.5">{children}</div>
    </details>
  )
}

// Checkbox list that truncates to `limit` rows behind a "Show N more" toggle.
// Selected options float to the top so a collapsed list still shows what's active.
function CheckList({ items, selected, onToggle, limit = 8 }: {
  items: string[]
  selected: string[]
  onToggle: (v: string) => void
  limit?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const ordered = [...items].sort((a, b) => Number(selected.includes(b)) - Number(selected.includes(a)))
  const shown = expanded ? ordered : ordered.slice(0, limit)
  return (
    <div className="space-y-[3px]">
      {shown.map(it => (
        <CheckRow key={it} checked={selected.includes(it)} onChange={() => onToggle(it)} label={it} />
      ))}
      {items.length > limit && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-1 text-[12px] text-ink-3 hover:text-brand-500 transition-colors"
        >
          {expanded ? 'Show less' : `Show ${items.length - limit} more`}
        </button>
      )}
    </div>
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
    <aside className="w-[226px] shrink-0 space-y-3 text-[13px]">

      {/* Rail head */}
      <div className="flex items-baseline justify-between pb-1">
        <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-ink">Filters</h2>
        {hasActiveFilters && (
          <button onClick={clearAll} className="text-[12px] text-ink-3 hover:text-brand-500 transition-colors">Clear all</button>
        )}
      </div>

      {/* Sort - boxed select (kept inline, not collapsible) */}
      <div className="pb-1">
        <p className="text-[12px] font-semibold text-ink-2 mb-2">Sort by</p>
        <select
          value={filters.sortBy}
          onChange={e => onChange({ ...filters, sortBy: e.target.value })}
          className="box-select w-full h-9 text-[13.5px] text-ink cursor-pointer"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Brands */}
      {availableBrands.length > 0 && (
        <Section title="Brand" count={filters.brands.length}>
          <CheckList items={availableBrands} selected={filters.brands}
            onToggle={v => onChange({ ...filters, brands: toggle(filters.brands, v) })} />
        </Section>
      )}

      {/* Lumens */}
      <Section title="Lumens" count={filters.minLumens > 0 || filters.maxLumens < LUMEN_MAX ? 1 : 0} defaultOpen>
        <RangeSlider
          floor={0} ceil={LUMEN_MAX} step={100}
          lo={filters.minLumens} hi={Math.min(filters.maxLumens, LUMEN_MAX)}
          onChange={(lo, hi) => onChange({ ...filters, minLumens: lo, maxLumens: hi })}
          format={v => `${v.toLocaleString()}${v >= LUMEN_MAX ? '+' : ''}`}
        />
      </Section>

      {/* Price Range */}
      <Section title="Price" count={filters.minPrice > 0 || filters.maxPrice < PRICE_MAX ? 1 : 0} defaultOpen>
        <RangeSlider
          floor={0} ceil={PRICE_CEIL} step={25}
          lo={filters.minPrice} hi={Math.min(filters.maxPrice, PRICE_CEIL)}
          onChange={(lo, hi) => onChange({ ...filters, minPrice: lo, maxPrice: hi >= PRICE_CEIL ? PRICE_MAX : hi })}
          format={v => `$${v.toLocaleString()}${v >= PRICE_CEIL ? '+' : ''}`}
        />
      </Section>

      {/* Category */}
      {categories.length > 0 && (
        <Section title="Category" count={filters.categories.length} defaultOpen>
          <CheckList items={categories} selected={filters.categories} limit={20}
            onToggle={v => onChange({ ...filters, categories: toggle(filters.categories, v) })} />
        </Section>
      )}

      {/* Made in */}
      {availableMadeIn.length > 0 && (
        <Section title="Made in" count={filters.madeIn.length}>
          <CheckList items={availableMadeIn} selected={filters.madeIn}
            onToggle={v => onChange({ ...filters, madeIn: toggle(filters.madeIn, v) })} />
        </Section>
      )}

      {/* Battery */}
      {batteryTypes.length > 0 && (
        <Section title="Battery" count={filters.batteryTypes.length}>
          <CheckList items={batteryTypes} selected={filters.batteryTypes}
            onToggle={v => onChange({ ...filters, batteryTypes: toggle(filters.batteryTypes, v) })} />
        </Section>
      )}

      {/* Emitters */}
      {availableEmitters.length > 0 && (
        <Section title="LED / Emitter" count={filters.emitters.length}>
          <CheckList items={availableEmitters} selected={filters.emitters}
            onToggle={v => onChange({ ...filters, emitters: toggle(filters.emitters, v) })} />
        </Section>
      )}

      {/* Charging */}
      <Section title="Charging" count={filters.chargingType !== null ? 1 : 0}>
        <div className="space-y-[3px]">
          {CHARGING_OPTIONS.map(({ value, label }) => (
            <RadioRow key={label} checked={filters.chargingType === value}
              onChange={() => onChange({ ...filters, chargingType: value })}
              label={label} />
          ))}
        </div>
      </Section>

      <p className="text-[11px] text-[#b8b8b0] leading-relaxed pt-2">
        <Link href="/terms" className="hover:text-ink-3 underline underline-offset-2">Terms</Link>
        {' '}·{' '}
        <Link href="/privacy" className="hover:text-ink-3 underline underline-offset-2">Privacy</Link>
        <br />
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
