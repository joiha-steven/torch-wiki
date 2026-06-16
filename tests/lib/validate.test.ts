import { describe, it, expect } from 'vitest'
import {
  isUuid,
  isEmail,
  isStr,
  isOptStr,
  isStringArray,
  readJson,
  MAX,
} from '@/lib/validate'

describe('isUuid', () => {
  it('accepts a valid v4 UUID', () => {
    expect(isUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
  })
  it('accepts uppercase hex (case-insensitive)', () => {
    expect(isUuid('123E4567-E89B-12D3-A456-426614174000')).toBe(true)
  })
  it('rejects a malformed UUID (wrong segment lengths)', () => {
    expect(isUuid('123-456-789')).toBe(false)
  })
  it('rejects a UUID with a non-hex character', () => {
    expect(isUuid('123e4567-e89b-12d3-a456-42661417400g')).toBe(false)
  })
  it('rejects an empty string', () => {
    expect(isUuid('')).toBe(false)
  })
  it('rejects non-string input (null/number)', () => {
    expect(isUuid(null)).toBe(false)
    expect(isUuid(42)).toBe(false)
    expect(isUuid(undefined)).toBe(false)
  })
})

describe('isEmail', () => {
  it('accepts a normal email', () => {
    expect(isEmail('hung.tran@joiha.com')).toBe(true)
  })
  it('rejects a string with no @', () => {
    expect(isEmail('not-an-email')).toBe(false)
  })
  it('rejects a string with no domain dot', () => {
    expect(isEmail('user@localhost')).toBe(false)
  })
  it('rejects whitespace inside the address', () => {
    expect(isEmail('a b@c.com')).toBe(false)
  })
  it('rejects an empty string', () => {
    expect(isEmail('')).toBe(false)
  })
  it('rejects an over-length address (>254 chars)', () => {
    const long = 'a'.repeat(250) + '@b.com'
    expect(isEmail(long)).toBe(false)
  })
  it('rejects non-string input', () => {
    expect(isEmail(null)).toBe(false)
    expect(isEmail({})).toBe(false)
  })
})

describe('isStr', () => {
  it('accepts a non-empty string within the limit', () => {
    expect(isStr('hello', 10)).toBe(true)
  })
  it('rejects an empty string', () => {
    expect(isStr('', 10)).toBe(false)
  })
  it('rejects a whitespace-only string', () => {
    expect(isStr('   ', 10)).toBe(false)
  })
  it('rejects a string longer than max', () => {
    expect(isStr('abcdef', 5)).toBe(false)
  })
  it('rejects non-string input (number/null/undefined)', () => {
    expect(isStr(5, 10)).toBe(false)
    expect(isStr(null, 10)).toBe(false)
    expect(isStr(undefined, 10)).toBe(false)
  })
})

describe('isOptStr', () => {
  it('accepts null and undefined (optional)', () => {
    expect(isOptStr(null, 10)).toBe(true)
    expect(isOptStr(undefined, 10)).toBe(true)
  })
  it('accepts an empty string (unlike isStr)', () => {
    expect(isOptStr('', 10)).toBe(true)
  })
  it('accepts a string within the limit', () => {
    expect(isOptStr('hi', 10)).toBe(true)
  })
  it('rejects a string over the limit', () => {
    expect(isOptStr('abcdef', 5)).toBe(false)
  })
  it('rejects a non-string non-null value', () => {
    expect(isOptStr(5, 10)).toBe(false)
  })
})

describe('isStringArray', () => {
  it('accepts an array of strings', () => {
    expect(isStringArray(['a', 'b'])).toBe(true)
  })
  it('accepts an empty array', () => {
    expect(isStringArray([])).toBe(true)
  })
  it('rejects an array with a non-string element', () => {
    expect(isStringArray(['a', 1])).toBe(false)
  })
  it('rejects a non-array value', () => {
    expect(isStringArray('a')).toBe(false)
    expect(isStringArray(null)).toBe(false)
  })
})

describe('MAX bounds', () => {
  it('exposes the expected upper bounds', () => {
    expect(MAX.name).toBe(255)
    expect(MAX.url).toBe(2048)
    expect(MAX.text).toBe(50_000)
  })
})

describe('readJson', () => {
  const makeReq = (impl: () => Promise<unknown>) =>
    ({ json: impl }) as unknown as Request

  it('returns the parsed object for valid JSON', async () => {
    const req = makeReq(async () => ({ a: 1, b: 'x' }))
    expect(await readJson(req)).toEqual({ a: 1, b: 'x' })
  })
  it('returns null on malformed JSON (so callers 400, not 500)', async () => {
    const req = makeReq(async () => {
      throw new SyntaxError('Unexpected token')
    })
    expect(await readJson(req)).toBeNull()
  })
  it('passes through missing fields untouched (no schema enforcement)', async () => {
    const req = makeReq(async () => ({}))
    expect(await readJson(req)).toEqual({})
  })
})
