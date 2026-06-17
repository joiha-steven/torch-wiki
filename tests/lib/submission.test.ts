import { describe, it, expect } from 'vitest'
import { buildSubmissionData } from '@/lib/submission'
import type { Flashlight } from '@/lib/types'

describe('buildSubmissionData', () => {
  it('parses comma-separated emitters, trimming + dropping blanks', () => {
    const out = buildSubmissionData({} as Partial<Flashlight>, [], ' Cree XHP70.2 , , Luminus SST-40 ')
    expect(out.emitters).toEqual(['Cree XHP70.2', 'Luminus SST-40'])
  })

  it('derives battery_options/types and legacy mirrors from the first row', () => {
    const out = buildSubmissionData({} as Partial<Flashlight>, [{ type: '18650', count: 2 }, { type: '', count: 1 }], '')
    expect(out.battery_options).toEqual([{ type: '18650', count: 2 }])
    expect(out.battery_types).toEqual(['18650'])
    expect(out.battery_type).toBe('18650')
    expect(out.battery_count).toBe(2)
  })

  it('coerces a non-positive count to 1', () => {
    const out = buildSubmissionData({} as Partial<Flashlight>, [{ type: 'AA', count: 0 }], '')
    expect(out.battery_options).toEqual([{ type: 'AA', count: 1 }])
  })

  it('nulls legacy mirrors when no battery rows', () => {
    const out = buildSubmissionData({} as Partial<Flashlight>, [], '')
    expect(out.battery_type).toBeNull()
    expect(out.battery_count).toBeNull()
  })

  it('strips join fields (reviews, flashlight_images) but keeps real columns', () => {
    const out = buildSubmissionData(
      { brand: 'Reylight', model: 'Crusader', reviews: [{}], flashlight_images: [{}] } as unknown as Partial<Flashlight>,
      [], '',
    )
    expect(out.brand).toBe('Reylight')
    expect(out.model).toBe('Crusader')
    expect(out).not.toHaveProperty('reviews')
    expect(out).not.toHaveProperty('flashlight_images')
  })
})
