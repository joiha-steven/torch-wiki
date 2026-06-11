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
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://www.nextorch.com/',
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
  name: 'Nextorch',
  country: 'China',
  made_in: 'China',
  founded_year: 2005,
  headquarters: 'Shenzhen, China',
  website: 'https://www.nextorch.com',
  about: "Nextorch (Nextorch Industries Co., Ltd.) was founded in 2005 by Robin Liang, whose core team came out of Yangjiang — China's centuries-old capital of knife and hardware manufacturing — bringing a deep background in precision metalworking, metallurgy and surface finishing. Its debut T6A (2005) was the first China-designed-and-built Xenon tactical flashlight, and in 2006 Nextorch won the Chinese Ministry of Public Security tender to design and supply duty flashlights for the national police (1.2M+ units), establishing it as a law-enforcement equipment maker. It moved early to LED (partnering with Cree) and became one of the first voting members of PLATO, helping shape the ANSI/NEMA FL1 flashlight standard. Today Nextorch spans tactical, duty and EDC lights plus an expanding tactical ecosystem — NEX Baton expandable batons, knives and multitools — drawing on its original metalworking roots. (The NEXDOT line covers weapon lights and aiming devices.)",
}

let flashlights = JSON.parse(readFileSync(join(__dirname, 'nextorch-data.json'), 'utf-8'))
if (process.env.ONLY) flashlights = flashlights.filter((f) => f.slug === process.env.ONLY)
if (process.env.LIMIT) flashlights = flashlights.slice(0, Number(process.env.LIMIT))

async function main() {
  const { error: bErr } = await supabase.from('brands').upsert(brand, { onConflict: 'name' })
  if (bErr) { console.error('Brand upsert failed:', bErr.message); process.exit(1) }
  console.log('✓ brand: Nextorch\n')

  let ok = 0, totalImgs = 0
  for (const f of flashlights) {
    const { images, ...row } = f
    process.stdout.write(`${row.model.padEnd(20)} ${row.slug.padEnd(24)} ${images.length}img … `)
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
    console.log(`ok (${blobUrls.length} hosted)`)
  }
  console.log(`\nDone. ${ok}/${flashlights.length} flashlights, ${totalImgs} images hosted.`)
}

main()
