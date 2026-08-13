// File storage driver. Two backends, selected by env at runtime:
//   STORAGE_DRIVER=local  → files on disk (FILES_ROOT), served by nginx at FILES_PUBLIC_BASE
//   otherwise             → Vercel Blob (original behavior)
// Server-only (fs/dynamic imports); client code goes through lib/upload-client.ts.

export const isLocalStorage = (): boolean => process.env.STORAGE_DRIVER === 'local'

const filesRoot = (): string => process.env.FILES_ROOT ?? '/home/torch/files'
const publicBase = (): string => (process.env.FILES_PUBLIC_BASE ?? '').replace(/\/$/, '')

/**
 * Validate a storage pathname (e.g. "flashlights/<slug>/manual.pdf").
 * Returns the normalized pathname or null. Blocks traversal, absolute paths,
 * empty/dot segments and characters outside [a-zA-Z0-9._-].
 */
export function sanitizeStoragePathname(pathname: string): string | null {
  if (!pathname || pathname.length > 512 || pathname.startsWith('/')) return null
  const segments = pathname.split('/')
  if (segments.length > 8) return null
  for (const s of segments) {
    if (!s || s === '.' || s === '..') return null
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(s)) return null
  }
  return segments.join('/')
}

/** Insert a random suffix before the extension: a/b.webp → a/b-1a2b3c4d.webp */
export function withRandomSuffix(pathname: string, hex: string): string {
  const dot = pathname.lastIndexOf('.')
  const slash = pathname.lastIndexOf('/')
  if (dot <= slash) return `${pathname}-${hex}`
  return `${pathname.slice(0, dot)}-${hex}${pathname.slice(dot)}`
}

/**
 * Map a stored-file URL back to its pathname relative to the storage root.
 * Accepts local URLs (under `base`) and Vercel Blob URLs. Null when foreign.
 */
export function storageUrlToPathname(url: string, base: string): string | null {
  try {
    const u = new URL(url)
    if (base) {
      const b = new URL(base)
      if (u.host === b.host && u.pathname.startsWith(b.pathname + '/')) {
        return sanitizeStoragePathname(decodeURIComponent(u.pathname.slice(b.pathname.length + 1)))
      }
    }
    if (u.host.endsWith('.public.blob.vercel-storage.com')) {
      return sanitizeStoragePathname(decodeURIComponent(u.pathname.slice(1)))
    }
    return null
  } catch {
    return null
  }
}

/** True for URLs we manage (local file host or Vercel Blob) — safe to delete on purge. */
export function isStoredFileUrl(url: string): boolean {
  if (!url) return false
  if (url.includes('.public.blob.vercel-storage.com')) return true
  const base = publicBase()
  return !!base && url.startsWith(base + '/')
}

export type StoragePutOptions = {
  contentType?: string
  addRandomSuffix?: boolean
}

/** Store a file, return its public URL. */
export async function storagePut(
  pathname: string,
  body: Buffer,
  opts: StoragePutOptions = {},
): Promise<{ url: string }> {
  if (!isLocalStorage()) {
    const { put } = await import('@vercel/blob')
    const { url } = await put(pathname, body, {
      access: 'public',
      contentType: opts.contentType,
      addRandomSuffix: opts.addRandomSuffix ?? false,
    })
    return { url }
  }

  let clean = sanitizeStoragePathname(pathname)
  if (!clean) throw new Error('Invalid storage pathname')
  if (opts.addRandomSuffix) {
    const { randomBytes } = await import('node:crypto')
    clean = withRandomSuffix(clean, randomBytes(4).toString('hex'))
  }
  const { mkdir, writeFile, rename } = await import('node:fs/promises')
  const { dirname, join } = await import('node:path')
  const dest = join(filesRoot(), clean)
  await mkdir(dirname(dest), { recursive: true })
  const tmp = `${dest}.tmp-${Date.now()}`
  await writeFile(tmp, body)
  await rename(tmp, dest)
  return { url: `${publicBase()}/${clean}` }
}

/** Delete a stored file. Best-effort: unknown/foreign URLs are ignored. */
export async function storageDel(url: string): Promise<void> {
  if (!isLocalStorage()) {
    const { del } = await import('@vercel/blob')
    await del(url)
    return
  }
  const rel = storageUrlToPathname(url, publicBase())
  if (!rel) return
  const { unlink } = await import('node:fs/promises')
  const { join } = await import('node:path')
  await unlink(join(filesRoot(), rel)).catch(() => {})
}

/** Copy a stored file to a new pathname, return the new URL. */
export async function storageCopy(fromUrl: string, toPathname: string): Promise<{ url: string }> {
  if (!isLocalStorage()) {
    const { copy } = await import('@vercel/blob')
    const { url } = await copy(fromUrl, toPathname, { access: 'public', addRandomSuffix: false })
    return { url }
  }
  const rel = storageUrlToPathname(fromUrl, publicBase())
  const clean = sanitizeStoragePathname(toPathname)
  if (!rel || !clean) throw new Error('Invalid storage copy')
  const { mkdir, copyFile } = await import('node:fs/promises')
  const { dirname, join } = await import('node:path')
  const dest = join(filesRoot(), clean)
  await mkdir(dirname(dest), { recursive: true })
  await copyFile(join(filesRoot(), rel), dest)
  return { url: `${publicBase()}/${clean}` }
}
