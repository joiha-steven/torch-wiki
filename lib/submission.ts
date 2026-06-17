import type { Flashlight, BatteryOption, MaterialEntry } from '@/lib/types'

// Assemble the submission `data` jsonb from form state. Strips join fields
// (reviews/flashlight_images aren't DB columns), derives battery_options/types
// and materials from the rows, keeps the legacy single-value mirrors. Pure → unit-tested.
export function buildSubmissionData(
  data: Partial<Flashlight>,
  batteryRows: BatteryOption[],
  emitterInput: string,
  materialRows: MaterialEntry[] = [],
): Record<string, unknown> {
  const { reviews: _r, flashlight_images: _fi, ...cleanData } = data as Record<string, unknown>
  const battery_options = batteryRows
    .filter(r => r.type)
    .map(r => ({ type: r.type, count: r.count > 0 ? r.count : 1 }))
  const battery_types = battery_options.map(o => o.type)
  const materials = materialRows
    .filter(r => r.material)
    .map(r => ({ material: r.material, finish: r.finish || null, color: r.color || null }))
  return {
    ...cleanData,
    emitters: emitterInput.split(',').map(s => s.trim()).filter(Boolean),
    battery_options,
    battery_types,
    battery_type: battery_options[0]?.type ?? null,   // legacy mirror
    battery_count: battery_options[0]?.count ?? null,  // legacy mirror
    materials,
    material: materials.length ? materials.map(m => m.material).join(', ') : null,  // legacy mirror
  }
}
