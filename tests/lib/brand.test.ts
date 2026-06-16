import { describe, it, expect } from 'vitest'
import { brandSlug } from '@/lib/brand'

describe('brandSlug', () => {
  it('lowercases and hyphenates a multi-word brand', () => {
    expect(brandSlug('Cool Fall')).toBe('cool-fall')
    expect(brandSlug('LED Lenser')).toBe('led-lenser')
  })
  it('collapses runs of non-alphanumeric characters into one hyphen', () => {
    expect(brandSlug('A  &  B')).toBe('a-b')
  })
  it('trims leading/trailing whitespace and stray separators', () => {
    expect(brandSlug('  SureFire  ')).toBe('surefire')
    expect(brandSlug('-Acebeam-')).toBe('acebeam')
  })
  it('keeps digits', () => {
    expect(brandSlug('Foursevens 47')).toBe('foursevens-47')
  })
  it('returns an empty string for separator-only input', () => {
    expect(brandSlug('---')).toBe('')
  })
})
