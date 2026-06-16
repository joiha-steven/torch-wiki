import { createClient } from '@supabase/supabase-js'
import { put } from '@vercel/blob'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

config({ path: '.env.local' })
const __dirname = dirname(fileURLToPath(import.meta.url))

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN

const delay = (ms) => new Promise((r) => setTimeout(r, ms))
function getExt(url) {
  try { const ext = new URL(url).pathname.split('.').pop(); return ext && ext.length <= 5 ? `.${ext.toLowerCase()}` : '.jpg' }
  catch { return '.jpg' }
}
async function download(url) {
  await delay(150)
  const res = await fetch(encodeURI(url), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://www.olight.com/',
      'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return { buf: Buffer.from(await res.arrayBuffer()), ct: res.headers.get('content-type') ?? 'image/jpeg' }
}
async function hostImages(slug, urls) {
  const out = []
  for (let i = 0; i < urls.length; i++) {
    try {
      const { buf, ct } = await download(urls[i])
      const name = i === 0 ? `primary${getExt(urls[i])}` : `extra-${i - 1}${getExt(urls[i])}`
      const { url } = await put(`flashlights/${slug}/${name}`, buf, { access: 'public', token: BLOB_TOKEN, contentType: ct, addRandomSuffix: true })
      out.push(url)
    } catch (err) {
      console.error(`    ! img ${i}: ${err.message}`)
    }
  }
  return out
}

const brand = {
  name: 'Olight',
  country: 'China',
  made_in: 'China',
  headquarters: 'Shenzhen, China',
  website: 'https://www.olight.com',
  about: "Olight is a flashlight manufacturer founded in 2007 and headquartered in Shenzhen, China, with major distribution arms such as Olight US (Georgia, USA) and Olight Europe. It is one of the best-known consumer EDC and tactical light brands, recognized for its magnetic MCC charging system and proprietary built-in batteries. Its line-up spans flat EDC lights (the Arkfeld and ArkPro series), the Baton pocket EDC family, the Warrior and Odin tactical/weapon lights, the Baldr and PL weapon lights, the Seeker high-output floodlights, the Marauder and Javelot high-power throwers, the Perun right-angle headlamps, and a wide range of keychain (i-series) and clip (Oclip) lights.",
}

let flashlights = JSON.parse(readFileSync(join(__dirname, 'olight-data.json'), 'utf-8'))
if (process.env.ONLY) flashlights = flashlights.filter((f) => f.slug === process.env.ONLY)
if (process.env.LIMIT) flashlights = flashlights.slice(0, Number(process.env.LIMIT))

async function main() {
  const { error: bErr } = await supabase.from('brands').upsert(brand, { onConflict: 'name' })
  if (bErr) { console.error('Brand upsert failed:', bErr.message); process.exit(1) }
  console.log('✓ brand: Olight\n')

  let ok = 0, totalImgs = 0
  for (const f of flashlights) {
    const { images, ...row } = f
    process.stdout.write(`${row.model.padEnd(20)} ${row.slug.padEnd(26)} ${images.length}img … `)
    const blobUrls = await hostImages(row.slug, images)
    totalImgs += blobUrls.length

    const { error } = await supabase
      .from('flashlights')
      .upsert({ ...row, image_url: blobUrls[0] ?? null }, { onConflict: 'slug' })
    if (error) { console.error(`\n  ✗ row ${row.slug}:`, error.message); process.exit(1) }

    const { data: fl } = await supabase.from('flashlights').select('id').eq('slug', row.slug).single()
    if (fl?.id) {
      await supabase.from('flashlight_images').delete().eq('flashlight_id', fl.id)
      const extras = blobUrls.slice(1).map((url, i) => ({ flashlight_id: fl.id, url, sort_order: i }))
      if (extras.length) {
        const { error: imgErr } = await supabase.from('flashlight_images').insert(extras)
        if (imgErr) { console.error(`\n  ✗ images ${row.slug}:`, imgErr.message); process.exit(1) }
      }
    }
    ok++
    console.log(`ok (${blobUrls.length} hosted)${row.is_discontinued ? ' [soldout]' : ''}`)
  }
  console.log(`\nDone. ${ok}/${flashlights.length} flashlights, ${totalImgs} images hosted.`)
}

main()
