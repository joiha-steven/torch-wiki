// Client-side upload entry point. Vercel build: direct-to-Blob upload via the
// route's token flow. Self-host build (NEXT_PUBLIC_STORAGE_DRIVER=local): plain
// multipart POST to the same route, which stores on disk (lib/local-upload.ts).
// Both return { url }.

export type UploadedFile = { url: string }

export async function uploadFile(
  pathname: string,
  file: File,
  opts: { handleUploadUrl: string; clientPayload?: string },
): Promise<UploadedFile> {
  if (process.env.NEXT_PUBLIC_STORAGE_DRIVER === 'local') {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('pathname', pathname)
    if (opts.clientPayload) fd.append('clientPayload', opts.clientPayload)
    const res = await fetch(opts.handleUploadUrl, { method: 'POST', body: fd })
    const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null
    if (!res.ok || !data?.url) throw new Error(data?.error ?? `Upload failed (${res.status})`)
    return { url: data.url }
  }
  const { upload } = await import('@vercel/blob/client')
  const blob = await upload(pathname, file, {
    access: 'public',
    handleUploadUrl: opts.handleUploadUrl,
    clientPayload: opts.clientPayload,
  })
  return { url: blob.url }
}
