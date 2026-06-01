import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const COLLECTIONS = [
  { handle: 'flashlights', category: 'EDC' },
  { handle: 'headlamps',   category: 'Headlamp' },
  { handle: 'area-lights', category: 'Flood' },
]

// Skip bundles and kids' lights
const SKIP_PATTERN = /powerbank|flex\d|kidbeam|kidled/i

function parseTags(tags) {
  const result = {}
  for (const tag of tags) {
    let m
    if ((m = tag.match(/^Lumens:MAX (\d+) lm - MIN (\d+) lm$/))) {
      result.max_lumens = parseInt(m[1])
      result.min_lumens = parseInt(m[2])
    }
    if ((m = tag.match(/^Length:([\d.]+) in$/))) {
      result.length_mm = Math.round(parseFloat(m[1]) * 25.4)
    }
    if ((m = tag.match(/^Weight:([\d.]+) oz$/))) {
      result.weight_g = Math.round(parseFloat(m[1]) * 28.3495)
    }
    if ((m = tag.match(/^IP:(IP\w+)$/))) {
      result.ip_rating = m[1]
    }
    if ((m = tag.match(/^M-(\d+)$/))) {
      result.beam_distance_m = parseInt(m[1])
    }
    if (tag === 'Rechargeable') result.charging_type = 'usb'
  }
  return result
}

function cleanDescription(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500) || null
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function run() {
  const seen = new Set()
  const toInsert = []

  for (const { handle, category } of COLLECTIONS) {
    const res = await fetch(`https://www.ledlenserusa.com/collections/${handle}/products.json?limit=250`)
    const { products } = await res.json()
    console.log(`\n[${handle}] ${products.length} products`)

    for (const p of products) {
      if (SKIP_PATTERN.test(p.handle)) { console.log(`  skip: ${p.handle}`); continue }
      if (seen.has(p.handle)) { console.log(`  dup:  ${p.handle}`); continue }
      seen.add(p.handle)

      await sleep(250)
      let description = null
      try {
        const pr = await fetch(`https://www.ledlenserusa.com/products/${p.handle}.json`)
        const pd = await pr.json()
        description = cleanDescription(pd.product.body_html || '')
      } catch {}

      const tagData = parseTags(p.tags)
      const price = p.variants[0] ? parseFloat(p.variants[0].price) : null
      const image = p.images[0]?.src ?? null
      const model = p.title.replace(/\s*(headlamp|flashlight|lantern|light)\s*$/i, '').trim()

      toInsert.push({
        brand:           'LED Lenser',
        model,
        slug:            'ledlenser-' + p.handle,
        category,
        price_usd:       price,
        image_url:       image,
        description,
        charging_type:   tagData.charging_type ?? 'none',
        has_usb_charging: tagData.charging_type === 'usb',
        max_lumens:      tagData.max_lumens ?? null,
        min_lumens:      tagData.min_lumens ?? null,
        beam_distance_m: tagData.beam_distance_m ?? null,
        length_mm:       tagData.length_mm ?? null,
        weight_g:        tagData.weight_g ?? null,
        ip_rating:       tagData.ip_rating ?? null,
        emitters:        [],
        is_discontinued: false,
      })
      console.log(`  + ${model} — ${tagData.max_lumens ?? '?'}lm $${price}`)
    }
  }

  console.log(`\nUpserting ${toInsert.length} rows...`)
  const { data, error } = await supabase
    .from('flashlights')
    .upsert(toInsert, { onConflict: 'slug' })
    .select('id, slug')

  if (error) { console.error(error.message); process.exit(1) }
  console.log(`✓ ${data.length} rows upserted`)
}

run().catch(console.error)
