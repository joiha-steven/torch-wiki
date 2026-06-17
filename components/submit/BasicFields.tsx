'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Flashlight } from '@/lib/types'
import { Field, input, NumberInput, CATEGORIES } from './shared'
import SuggestInput from './SuggestInput'

type Props = {
  data: Partial<Flashlight>
  set: (k: keyof Flashlight, v: unknown) => void
  num: (v: string) => number | null
  // In edit mode, the slug of the row being edited - so it isn't flagged as a
  // duplicate of itself.
  currentSlug?: string
}

// Module-level caches: fetched once per session, shared across every form mount.
type CatalogRow = { brand: string; model: string; slug: string }
let brandsCache: string[] | null = null
let brandsInflight: Promise<string[]> | null = null
let catalogCache: CatalogRow[] | null = null
let catalogInflight: Promise<CatalogRow[]> | null = null

function loadBrands(): Promise<string[]> {
  if (brandsCache) return Promise.resolve(brandsCache)
  if (!brandsInflight) brandsInflight = (async () => {
    try {
      const { data } = await supabase.from('brands').select('name').is('deleted_at', null)
      brandsCache = ((data ?? []) as { name: string }[]).map(r => r.name).filter(Boolean)
      return brandsCache
    } catch { return [] }
  })()
  return brandsInflight
}

function loadCatalog(): Promise<CatalogRow[]> {
  if (catalogCache) return Promise.resolve(catalogCache)
  if (!catalogInflight) catalogInflight = (async () => {
    try {
      const { data } = await supabase.from('flashlights').select('brand,model,slug').is('deleted_at', null)
      catalogCache = (data ?? []) as CatalogRow[]
      return catalogCache
    } catch { return [] }
  })()
  return catalogInflight
}

export default function BasicFields({ data, set, num, currentSlug }: Props) {
  const [brands, setBrands] = useState<string[]>(brandsCache ?? [])
  const [catalog, setCatalog] = useState<CatalogRow[]>(catalogCache ?? [])

  useEffect(() => { loadBrands().then(setBrands); loadCatalog().then(setCatalog) }, [])

  const brand = (data.brand ?? '').trim()
  const model = (data.model ?? '').trim()

  // Model suggestions: scoped to the typed brand once there is one; before a brand
  // is entered, suggest across all models so the field still helps / surfaces matches.
  const brandModels = brand
    ? Array.from(new Set(catalog.filter(c => c.brand.toLowerCase() === brand.toLowerCase()).map(c => c.model)))
    : Array.from(new Set(catalog.map(c => c.model)))

  // Duplicate: same brand + model already in the catalog (case-insensitive),
  // excluding the row being edited.
  const dup = brand && model
    ? catalog.find(c =>
        c.brand.toLowerCase() === brand.toLowerCase() &&
        c.model.toLowerCase() === model.toLowerCase() &&
        c.slug !== currentSlug)
    : undefined

  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="Brand" required hint="Brand's proper name, e.g. Olight, Nichia - reuse one from the list when it exists; don't ALL-CAPS.">
        <SuggestInput
          value={data.brand ?? ''}
          onChange={v => set('brand', v)}
          options={brands}
          placeholder="e.g. Surefire"
        />
      </Field>
      <Field label="Model" required hint="Model only, without the brand. e.g. M600DF Scout">
        <SuggestInput
          value={data.model ?? ''}
          onChange={v => set('model', v)}
          options={brandModels}
          placeholder="e.g. M600DF Scout"
        />
      </Field>

      {dup && (
        <div className="col-span-2 -mt-1 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          A flashlight named <b>{dup.brand} {dup.model}</b> already exists.{' '}
          <Link href={`/${dup.slug}`} target="_blank" className="underline underline-offset-2 hover:text-amber-800">
            View it
          </Link>{' '}- check before adding a duplicate.
        </div>
      )}

      <Field label="Category">
        <select className={input} value={data.category ?? ''} onChange={e => set('category', e.target.value || null)}>
          <option value="">- Select -</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Year" hint="Release year, e.g. 2023">
        <NumberInput className={input} value={data.year ?? ''} onChange={e => set('year', num(e.target.value))} placeholder="e.g. 2023" />
      </Field>
    </div>
  )
}
