// Canonical option lists shared by the contribute/edit form (components/submit)
// and the browse FilterPanel, so the two never drift apart.

export const CATEGORIES = [
  'EDC', 'Tactical', 'Weapon Light', 'Thrower', 'Flood', 'Headlamp',
  'Search & Rescue', 'Diving', 'Work', 'Custom',
]

// Battery types a contributor can pick (no free typing). Ordered: disposable /
// standard cells, coin / button cells, Li-ion rechargeables (small → large),
// then Built-in. The browse filter only surfaces the ones actually in use (facet
// narrowing), so adding rarely-used sizes here doesn't clutter the rail.
export const BATTERY_TYPES = [
  // Disposable / standard
  'AAAA', 'AAA', 'AA', 'C-cell', 'D-cell', '9V', 'CR123A', 'CR2',
  // Coin / button
  'CR2032', 'CR2025', 'CR2016', 'LR44',
  // Li-ion rechargeable (cylindrical), small → large
  '10180', '10280', '10440', '14500', '16340', '16650', '18350', '18500',
  '18650', '20700', '21700', '26350', '26650', '26800', '32650',
  // Large-format Li-ion (high-power lights)
  '33140', '46110', '46800', '46900', '46950',
  // Other
  'Built-in',
]
