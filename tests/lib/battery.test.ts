import { describe, it, expect } from 'vitest'
import { batteryOptions, formatBatteries } from '@/lib/battery'

describe('batteryOptions', () => {
  it('returns the canonical battery_options when present', () => {
    expect(batteryOptions({ battery_options: [{ type: '18650', count: 1 }] })).toEqual([
      { type: '18650', count: 1 },
    ])
  })
  it('filters out entries with no type', () => {
    expect(
      batteryOptions({
        battery_options: [{ type: '18650', count: 1 }, { type: '', count: 2 }],
      }),
    ).toEqual([{ type: '18650', count: 1 }])
  })
  it('falls back to legacy battery_type/count when options are empty', () => {
    expect(batteryOptions({ battery_options: [], battery_type: '21700', battery_count: 2 })).toEqual([
      { type: '21700', count: 2 },
    ])
  })
  it('defaults legacy count to 1 when missing', () => {
    expect(batteryOptions({ battery_type: 'AA' })).toEqual([{ type: 'AA', count: 1 }])
  })
  it('returns an empty array when nothing is set', () => {
    expect(batteryOptions({})).toEqual([])
    expect(batteryOptions({ battery_options: null, battery_type: null })).toEqual([])
  })
  it('prefers battery_options over legacy fields', () => {
    expect(
      batteryOptions({
        battery_options: [{ type: '18350', count: 2 }],
        battery_type: '18650',
        battery_count: 1,
      }),
    ).toEqual([{ type: '18350', count: 2 }])
  })
})

describe('formatBatteries', () => {
  it('formats a single battery with count', () => {
    expect(formatBatteries({ battery_options: [{ type: '18650', count: 1 }] })).toBe('1× 18650')
  })
  it('joins alternatives with " / "', () => {
    expect(
      formatBatteries({
        battery_options: [
          { type: '18350', count: 2 },
          { type: '18650', count: 1 },
        ],
      }),
    ).toBe('2× 18350 / 1× 18650')
  })
  it('drops counts when withCount is false (compact card display)', () => {
    expect(
      formatBatteries(
        {
          battery_options: [
            { type: '18350', count: 2 },
            { type: '18650', count: 1 },
          ],
        },
        false,
      ),
    ).toBe('18350 / 18650')
  })
  it('omits the count when it is zero/falsy even with withCount', () => {
    expect(formatBatteries({ battery_options: [{ type: 'Built-in', count: 0 }] })).toBe('Built-in')
  })
  it('uses the legacy fields as a fallback', () => {
    expect(formatBatteries({ battery_type: 'CR123A', battery_count: 2 })).toBe('2× CR123A')
  })
  it('returns null when there is no battery data', () => {
    expect(formatBatteries({})).toBeNull()
    expect(formatBatteries({ battery_options: null, battery_type: null })).toBeNull()
  })
})
