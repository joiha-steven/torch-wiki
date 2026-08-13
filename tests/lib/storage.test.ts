import { describe, expect, it } from 'vitest'
import { sanitizeStoragePathname, storageUrlToPathname, withRandomSuffix, isStoredFileUrl } from '@/lib/storage'

const BASE = 'https://torch.edc.wiki/files'

describe('sanitizeStoragePathname', () => {
  it('accepts normal pathnames', () => {
    expect(sanitizeStoragePathname('flashlights/acebeam-e75/manual.pdf')).toBe('flashlights/acebeam-e75/manual.pdf')
    expect(sanitizeStoragePathname('reports/6f9619ff-8b86-d011-b42d-00c04fc964ff.webp')).toBe('reports/6f9619ff-8b86-d011-b42d-00c04fc964ff.webp')
  })
  it('rejects traversal and absolute paths', () => {
    expect(sanitizeStoragePathname('../etc/passwd')).toBeNull()
    expect(sanitizeStoragePathname('a/../b')).toBeNull()
    expect(sanitizeStoragePathname('/etc/passwd')).toBeNull()
    expect(sanitizeStoragePathname('a//b')).toBeNull()
    expect(sanitizeStoragePathname('a/./b')).toBeNull()
  })
  it('rejects hidden files, weird chars, oversize', () => {
    expect(sanitizeStoragePathname('.env')).toBeNull()
    expect(sanitizeStoragePathname('a/.hidden')).toBeNull()
    expect(sanitizeStoragePathname('a b/c.png')).toBeNull()
    expect(sanitizeStoragePathname('a%2f/c.png')).toBeNull()
    expect(sanitizeStoragePathname('x'.repeat(513))).toBeNull()
    expect(sanitizeStoragePathname('a/b/c/d/e/f/g/h/i.png')).toBeNull()
  })
})

describe('withRandomSuffix', () => {
  it('inserts before the extension', () => {
    expect(withRandomSuffix('a/b.webp', '1a2b3c4d')).toBe('a/b-1a2b3c4d.webp')
  })
  it('appends when there is no extension', () => {
    expect(withRandomSuffix('a/noext', '1a2b3c4d')).toBe('a/noext-1a2b3c4d')
  })
  it('ignores dots in directories', () => {
    expect(withRandomSuffix('a.dir/noext', 'ff')).toBe('a.dir/noext-ff')
  })
})

describe('storageUrlToPathname', () => {
  it('maps local URLs under the base', () => {
    expect(storageUrlToPathname(`${BASE}/flashlights/x/manual.pdf`, BASE)).toBe('flashlights/x/manual.pdf')
  })
  it('maps Vercel Blob URLs', () => {
    expect(storageUrlToPathname('https://73q.public.blob.vercel-storage.com/reports/a.webp', BASE)).toBe('reports/a.webp')
  })
  it('rejects foreign hosts and traversal', () => {
    expect(storageUrlToPathname('https://evil.com/files/a.png', BASE)).toBeNull()
    expect(storageUrlToPathname(`${BASE}/../../etc/passwd`, BASE)).toBeNull()
    expect(storageUrlToPathname(`${BASE}/%2e%2e/b.png`, BASE)).toBeNull()
    expect(storageUrlToPathname('not a url', BASE)).toBeNull()
  })
  it('rejects the bare base with no pathname', () => {
    expect(storageUrlToPathname(BASE, BASE)).toBeNull()
  })
})

describe('isStoredFileUrl', () => {
  it('always recognizes blob URLs', () => {
    expect(isStoredFileUrl('https://73q.public.blob.vercel-storage.com/a.webp')).toBe(true)
  })
  it('rejects empty and foreign URLs', () => {
    expect(isStoredFileUrl('')).toBe(false)
    expect(isStoredFileUrl('https://cdn.shopify.com/x.png')).toBe(false)
  })
})
