import type { MaterialEntry } from '@/lib/types'

// Structured material vocabulary for the contribute form. A flashlight has up to
// 3 MaterialEntry rows; each picks a Material, then a Finish (scoped to that
// material), then - only for colour-bearing finishes - a Colour. Damasteel is
// special: its "finish" is the Damascus pattern and the colour slot is the etch
// state. Replaces the old free-text `material` column (kept as a display fallback).

export const MATERIALS = [
  'Aluminum', 'Titanium', 'Copper', 'Brass', 'Bronze', 'Stainless Steel',
  'Magnesium', 'Zinc Alloy', 'Polymer / Nylon', 'Carbon Fiber',
  'Zirconium', 'Timascus', 'Zircuti', 'Mokume', 'Damasteel',
] as const

export const DAMASTEEL = 'Damasteel'

// Finish options per material (first entry is the default).
export const FINISHES: Record<string, string[]> = {
  'Aluminum': ['Anodized', 'Cerakote', 'PVD', 'Powder-coated', 'Bead-blasted', 'Tumbled', 'Raw'],
  'Titanium': ['Raw', 'Stonewashed', 'Bead-blasted', 'Tumbled', 'Polished', 'Anodized', 'PVD', 'Acid-etched'],
  'Copper': ['Raw', 'Patina'],
  'Brass': ['Raw', 'Patina'],
  'Bronze': ['Raw', 'Patina'],
  'Stainless Steel': ['Raw', 'Bead-blasted', 'Stonewashed', 'Tumbled', 'Polished', 'PVD'],
  'Magnesium': ['Raw', 'Anodized', 'Cerakote'],
  'Zinc Alloy': ['Raw', 'Painted', 'Plated'],
  'Polymer / Nylon': ['Molded'],
  'Carbon Fiber': ['Raw / Clear-coat'],
  'Zirconium': ['Raw', 'Stonewashed', 'Bead-blasted', 'Acid-etched', 'Oilslick', 'Polished'],
  'Timascus': ['Raw', 'Anodized', 'Etched'],
  'Zircuti': ['Raw', 'Anodized', 'Etched'],
  'Mokume': ['Raw', 'Etched', 'Polished'],
  'Damasteel': ['Raw', 'Fenja', "Odin's Eye", 'Thor', 'Vinland', 'Rose', 'Hakkapella', "Björkman's Twist", 'Other'],
}

// Finishes that carry a colour choice → show the Colour selector (default Black).
export const COLOR_BEARING = new Set(['Anodized', 'Cerakote', 'PVD', 'Powder-coated', 'Painted', 'Molded'])

// Damasteel uses the colour slot for the etch state instead of a colour.
export const DAMASTEEL_STATES = ['Unetched', 'Etched']

export const COLORS = [
  'Black', 'Gunmetal Grey', 'Graphite', 'Silver', 'White', 'Tan/FDE', 'Coyote/Sand',
  'Bronze', 'Burnt Bronze', 'Copper', 'Gold', 'Rose Gold', 'Champagne',
  'Red', 'Crimson', 'Orange', 'Yellow', 'OD Green', 'Army Green', 'Green', 'Emerald',
  'Teal', 'Cyan', 'Sky Blue', 'Blue', 'Navy', 'Purple', 'Violet', 'Pink', 'Flamed/Rainbow',
]

export function defaultFinish(material: string): string | null {
  return FINISHES[material]?.[0] ?? null
}

// Does this material+finish combination show the colour/etch selector?
export function showsColor(material: string, finish: string | null): boolean {
  if (!material || !finish) return false
  if (material === DAMASTEEL) return true            // etch-state slot
  return COLOR_BEARING.has(finish)
}

// Default value for the colour slot when it becomes visible.
export function defaultColor(material: string): string {
  return material === DAMASTEEL ? 'Unetched' : 'Black'
}

// Human string for detail/compare display. "Aluminum · Anodized · Black  +  Titanium · Stonewashed"
export function formatMaterials(rows: MaterialEntry[] | null | undefined): string | null {
  if (!Array.isArray(rows) || rows.length === 0) return null
  const parts = rows
    .filter(r => r && r.material)
    .map(r => [r.material, r.finish, r.color].filter(Boolean).join(' · '))
  return parts.length ? parts.join('  +  ') : null
}
