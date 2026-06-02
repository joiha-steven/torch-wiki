import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BASE = 'https://www.coolfall.com/images'

const flashlight = {
  brand: 'Cool Fall',
  model: 'Trek',
  slug: 'cool-fall-trek',
  category: 'Custom',
  battery_type: 'CR123A',
  battery_count: 2,
  charging_type: 'none',
  has_usb_charging: false,
  beam_type: 'Flood',
  image_url: `${BASE}/trek01.jpg`,
  description: `The Trek is Cool Fall's only SPY-series light with a pocket clip, making it the most carry-friendly model in the lineup. The rotating knob — a hallmark of all SPY lights — clicks through six brightness levels with firm, tactile feedback and is shaped specifically to sit comfortably in a pocket. Features a trit slot on both the knob and body, and a sapphire lens.

Two versions are available:

Smooth — stone-washed finish, choice of copper or titanium head. The copper version develops a natural dark patina over time; the titanium head offers a lighter, corrosion-resistant alternative.

Hammerhead — hammered copper head with a 3D surface texture and stone-washed patina. Same feature set as the Smooth, with a more aggressive visual character.

Both versions include a toolless battery cap engraved with the Cool Fall snowflake logo.`,
  notes: 'Currently on hiatus — expected to return to the shop in 2025. Orders placed by email.',
  is_discontinued: false,
}

// Extra images (trek02–trek09, product shots EU1C8286sss, EU1C8294sss)
const EXTRA_IMAGES = [
  'trek02.jpg', 'trek03.jpg', 'trek04.jpg', 'trek05.jpg',
  'trek06.jpg', 'trek07.jpg', 'trek08.jpg', 'trek09.jpg',
  'EU1C8286sss.jpg', 'EU1C8294sss.jpg',
]

async function run() {
  // Check if already exists
  const { data: existing } = await supabase
    .from('flashlights')
    .select('id, slug, image_url')
    .eq('slug', flashlight.slug)
    .single()

  let id

  if (existing) {
    console.log(`↺  Updating existing: ${flashlight.slug} (id: ${existing.id})`)
    const { error } = await supabase
      .from('flashlights')
      .update({
        image_url: flashlight.image_url,
        description: flashlight.description,
        notes: flashlight.notes,
        battery_type: flashlight.battery_type,
        battery_count: flashlight.battery_count,
        charging_type: flashlight.charging_type,
        has_usb_charging: flashlight.has_usb_charging,
        beam_type: flashlight.beam_type,
        category: flashlight.category,
      })
      .eq('id', existing.id)
    if (error) { console.error('❌ Update failed:', error.message); process.exit(1) }
    id = existing.id
    console.log(`✅ Updated`)
  } else {
    const { data, error } = await supabase
      .from('flashlights')
      .insert(flashlight)
      .select()
      .single()
    if (error) { console.error('❌ Insert failed:', error.message); process.exit(1) }
    id = data.id
    console.log(`✅ Inserted: ${data.brand} ${data.model} (id: ${data.id})`)
  }

  // Insert extra images (skip if already inserted)
  const { data: existingExtras } = await supabase
    .from('flashlight_images')
    .select('url')
    .eq('flashlight_id', id)

  const existingUrls = new Set((existingExtras ?? []).map(e => e.url))

  const extras = EXTRA_IMAGES
    .map((name, i) => ({ url: `${BASE}/${name}`, sort_order: i + 1 }))
    .filter(e => !existingUrls.has(e.url))

  if (extras.length) {
    const { error: ei } = await supabase
      .from('flashlight_images')
      .insert(extras.map(e => ({ flashlight_id: id, ...e })))
    if (ei) { console.error('❌ Extra images failed:', ei.message) }
    else console.log(`✅ Added ${extras.length} extra images`)
  } else {
    console.log('⚠️  Extra images already exist — skipped')
  }

  console.log('\nNext step: run  node scripts/migrate-to-vercel-blob.mjs  to upload images to Vercel Blob')
}

run()
