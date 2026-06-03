import type { BatteryOption } from './types'

type BatteryFields = {
  battery_options?: BatteryOption[] | null
  battery_type?: string | null
  battery_count?: number | null
}

/** Canonical list of battery configurations, falling back to the legacy single value. */
export function batteryOptions(f: BatteryFields): BatteryOption[] {
  if (f.battery_options && f.battery_options.length > 0) {
    return f.battery_options.filter(o => o && o.type)
  }
  if (f.battery_type) return [{ type: f.battery_type, count: f.battery_count ?? 1 }]
  return []
}

/**
 * Human label for a flashlight's battery support.
 * Alternatives are joined with " / " (e.g. "2× 18350 / 1× 18650").
 * `withCount: false` drops the cell count for compact display (e.g. cards).
 */
export function formatBatteries(f: BatteryFields, withCount = true): string | null {
  const opts = batteryOptions(f)
  if (opts.length === 0) return null
  return opts
    .map(o => (withCount && o.count ? `${o.count}× ${o.type}` : o.type))
    .join(' / ')
}
