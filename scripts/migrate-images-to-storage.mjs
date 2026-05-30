import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => l.split('=').map((s) => s.trim()))
)

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const BUCKET = 'flashlights'

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some((b) => b.name === BUCKET)
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error) throw new Error(`Create bucket failed: ${error.message}`)
    console.log(`✓ Created bucket "${BUCKET}"`)
  } else {
    console.log(`✓ Bucket "${BUCKET}" exists`)
  }
}

function storageUrl(path) {
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`
}

function filenameFromUrl(url) {
  return url.split('?')[0].split('/').pop()
}

async function downloadAndUpload(sourceUrl, storagePath) {
  const res = await fetch(sourceUrl)
  if (!res.ok) {
    console.warn(`  ✗ Failed to fetch ${sourceUrl} (${res.status})`)
    return null
  }
  const buffer = await res.arrayBuffer()
  const contentType = res.headers.get('content-type') ?? 'image/jpeg'

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: true })

  if (error) {
    console.warn(`  ✗ Upload failed for ${storagePath}: ${error.message}`)
    return null
  }
  return storageUrl(storagePath)
}

async function migrate() {
  await ensureBucket()

  // Fetch all flashlights
  const { data: flashlights, error: flErr } = await supabase
    .from('flashlights')
    .select('id, slug, image_url')
  if (flErr) throw new Error(flErr.message)

  console.log(`\nMigrating primary images for ${flashlights.length} flashlights...`)
  for (const f of flashlights) {
    if (!f.image_url) continue
    const filename = filenameFromUrl(f.image_url)
    const storagePath = `${f.slug}/${filename}`
    process.stdout.write(`  ${f.slug}/${filename} ... `)
    const newUrl = await downloadAndUpload(f.image_url, storagePath)
    if (newUrl) {
      await supabase.from('flashlights').update({ image_url: newUrl }).eq('id', f.id)
      console.log('✓')
    }
  }

  // Fetch all extra images
  const { data: images, error: imgErr } = await supabase
    .from('flashlight_images')
    .select('id, flashlight_id, url, sort_order')
  if (imgErr) throw new Error(imgErr.message)

  // Build slug lookup
  const idToSlug = Object.fromEntries(flashlights.map((f) => [f.id, f.slug]))

  console.log(`\nMigrating ${images.length} extra images...`)
  for (const img of images) {
    const slug = idToSlug[img.flashlight_id]
    if (!slug) continue
    const filename = filenameFromUrl(img.url)
    const storagePath = `${slug}/extra-${img.sort_order}-${filename}`
    process.stdout.write(`  ${storagePath} ... `)
    const newUrl = await downloadAndUpload(img.url, storagePath)
    if (newUrl) {
      await supabase.from('flashlight_images').update({ url: newUrl }).eq('id', img.id)
      console.log('✓')
    }
  }

  console.log('\nDone!')
}

migrate().catch((e) => { console.error(e.message); process.exit(1) })
