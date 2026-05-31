import { put } from '@vercel/blob'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envFile = readFileSync(join(__dirname, '../.env.local'), 'utf-8')
const env = Object.fromEntries(
  envFile.split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"(.*)"$/s, '$1')]
    })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const BLOB_TOKEN = env.BLOB_READ_WRITE_TOKEN

function getExt(url) {
  try {
    const p = new URL(url).pathname
    const ext = p.split('.').pop()
    return ext && ext.length <= 5 ? `.${ext}` : '.jpg'
  } catch {
    return '.jpg'
  }
}

function isAlreadyBlob(url) {
  return url && (url.includes('vercel-storage.com') || url.includes('blob.vercel'))
}

async function download(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  const ct = res.headers.get('content-type') ?? 'image/jpeg'
  const buf = await res.arrayBuffer()
  return { buf, ct }
}

async function upload(buf, ct, blobPath) {
  const { url } = await put(blobPath, buf, {
    access: 'public',
    token: BLOB_TOKEN,
    contentType: ct,
  })
  return url
}

async function migrate() {
  // --- Primary images ---
  const { data: flashlights, error: fe } = await supabase
    .from('flashlights')
    .select('id, slug, image_url')
    .not('image_url', 'is', null)

  if (fe) { console.error('Fetch flashlights error:', fe.message); process.exit(1) }
  console.log(`\n=== Primary images: ${flashlights.length} ===`)

  const slugMap = {}
  for (const f of flashlights) {
    slugMap[f.id] = f.slug

    if (isAlreadyBlob(f.image_url)) {
      console.log(`  [skip] ${f.slug}`)
      continue
    }
    try {
      const ext = getExt(f.image_url)
      const { buf, ct } = await download(f.image_url)
      const newUrl = await upload(buf, ct, `flashlights/${f.slug}/primary${ext}`)
      await supabase.from('flashlights').update({ image_url: newUrl }).eq('id', f.id)
      console.log(`  [ok]   ${f.slug}`)
    } catch (err) {
      console.error(`  [err]  ${f.slug}: ${err.message}`)
    }
  }

  // --- Extra images ---
  const { data: extras, error: ee } = await supabase
    .from('flashlight_images')
    .select('id, flashlight_id, url, sort_order')

  if (ee) { console.error('Fetch extras error:', ee.message); process.exit(1) }
  console.log(`\n=== Extra images: ${extras.length} ===`)

  for (const img of extras) {
    if (isAlreadyBlob(img.url)) {
      console.log(`  [skip] extra ${img.id}`)
      continue
    }
    try {
      const slug = slugMap[img.flashlight_id] ?? img.flashlight_id
      const ext = getExt(img.url)
      const { buf, ct } = await download(img.url)
      const newUrl = await upload(buf, ct, `flashlights/${slug}/extra-${img.sort_order}${ext}`)
      await supabase.from('flashlight_images').update({ url: newUrl }).eq('id', img.id)
      console.log(`  [ok]   ${slug}/extra-${img.sort_order}`)
    } catch (err) {
      console.error(`  [err]  ${img.id}: ${err.message}`)
    }
  }

  console.log('\nDone!')
}

migrate()
