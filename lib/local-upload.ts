// Local-mode counterpart of @vercel/blob's handleUpload token flow. The client
// (lib/upload-client.ts) POSTs multipart {file, pathname, clientPayload} to the
// same route; the route runs the SAME authorization it would use in
// onBeforeGenerateToken, then writes via storagePut. Server-only.
import { NextResponse } from 'next/server'
import { sanitizeStoragePathname, storagePut } from '@/lib/storage'

export type LocalUploadRules = {
  /** Throws (or rejects) when the request is not allowed. Receives clientPayload. */
  authorize: (clientPayload: string) => Promise<void>
  allowedContentTypes: string[]
  maximumSizeInBytes: number
  addRandomSuffix?: boolean
}

export async function handleLocalUpload(request: Request, rules: LocalUploadRules): Promise<NextResponse> {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 })
  }
  const file = form.get('file')
  const pathname = form.get('pathname')
  const clientPayload = form.get('clientPayload')

  if (!(file instanceof File) || typeof pathname !== 'string') {
    return NextResponse.json({ error: 'Missing file or pathname' }, { status: 400 })
  }
  try {
    await rules.authorize(typeof clientPayload === 'string' ? clientPayload : '')
  } catch (e) {
    const msg = (e as Error).message || 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: msg === 'Forbidden' ? 403 : 401 })
  }
  if (!rules.allowedContentTypes.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  }
  if (file.size > rules.maximumSizeInBytes) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 })
  }
  if (!sanitizeStoragePathname(pathname)) {
    return NextResponse.json({ error: 'Invalid pathname' }, { status: 400 })
  }

  const buf = Buffer.from(await file.arrayBuffer())
  const { url } = await storagePut(pathname, buf, {
    contentType: file.type,
    addRandomSuffix: rules.addRandomSuffix,
  })
  return NextResponse.json({ url })
}
