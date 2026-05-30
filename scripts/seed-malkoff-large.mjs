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

const flashlights = [
  {
    brand: 'Malkoff',
    model: 'MDX4 M91 H/L Switch',
    slug: 'malkoff-mdx4-m91-hl-switch',
    category: 'Tactical',
    price_usd: 255.99,
    buy_url: 'https://malkoffdevices.com/products/m91-flashlight',
    max_lumens: 1000,
    min_lumens: 20,
    beam_distance_m: 457,
    beam_type: 'Throw',
    emitter: 'Malkoff M91T',
    battery_type: '18650',
    battery_count: 2,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: null,
    head_diameter_mm: null,
    body_diameter_mm: null,
    weight_g: null,
    material: '6061-T6 Aluminum, Type III Hard Anodized',
    ip_rating: null,
    impact_resistance_m: null,
    image_url: 'https://malkoffdevices.com/cdn/shop/files/IMG_E8761.jpg',
    description: 'Dual 18650 large format flashlight with M91 module and high/low head-rotation switch. Available in flood or 457m throw variants.',
    is_discontinued: false,
  },
  {
    brand: 'Malkoff',
    model: 'Hound Dog Super',
    slug: 'malkoff-hound-dog-super',
    category: 'Search & Rescue',
    price_usd: 308.99,
    buy_url: 'https://malkoffdevices.com/products/hound-dog-super-flashlight',
    max_lumens: 1700,
    min_lumens: 80,
    beam_distance_m: null,
    beam_type: 'Throw',
    emitter: 'Cree XP-L',
    battery_type: '18650',
    battery_count: 2,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: 216,
    head_diameter_mm: 59.7,
    body_diameter_mm: 25.4,
    weight_g: null,
    material: '6061-T6 Aluminum, Type III Hard Anodized',
    ip_rating: null,
    impact_resistance_m: null,
    image_url: 'https://malkoffdevices.com/cdn/shop/products/HDSuperMD4.jpg',
    description: '1700 lumen predator hunting spotlight with 75,000 candela and 7-degree optic. Effective range 1500+ feet.',
    is_discontinued: false,
  },
  {
    brand: 'Malkoff',
    model: 'Hound Dog XPL',
    slug: 'malkoff-hound-dog-xpl',
    category: 'Search & Rescue',
    price_usd: 249.99,
    buy_url: 'https://malkoffdevices.com/products/hound-dog-xpl-flashlight',
    max_lumens: 1000,
    min_lumens: 70,
    beam_distance_m: 305,
    beam_type: 'Throw',
    emitter: 'Cree XP-L HI',
    battery_type: '18650',
    battery_count: 2,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: null,
    head_diameter_mm: 45.7,
    body_diameter_mm: null,
    weight_g: null,
    material: 'Aluminum, Type III Hard Anodized',
    ip_rating: null,
    impact_resistance_m: null,
    image_url: 'https://malkoffdevices.com/cdn/shop/products/HDXPLMD4.jpg',
    description: '1000 lumen long-throw flashlight with 45,000 candela. Tight hotspot with good spill. 1000+ foot range. Fully potted.',
    is_discontinued: false,
  },
  {
    brand: 'Malkoff',
    model: 'Turn Key Hound Dog 18650 XT Cool',
    slug: 'malkoff-turn-key-hound-dog-18650-xt-cool',
    category: 'Search & Rescue',
    price_usd: 253.99,
    buy_url: 'https://malkoffdevices.com/products/turn-key-hound-dog-18650-xt-cool-flashlight',
    max_lumens: 850,
    min_lumens: 75,
    beam_distance_m: 305,
    beam_type: 'Throw',
    emitter: null,
    battery_type: '18650',
    battery_count: 1,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: 152.4,
    head_diameter_mm: 45.7,
    body_diameter_mm: 25.4,
    weight_g: null,
    material: 'Type III Hard Anodized Aluminum',
    ip_rating: null,
    impact_resistance_m: null,
    image_url: 'https://malkoffdevices.com/cdn/shop/products/HoundDog18650XTside.jpg',
    description: '850 lumen single-18650 thrower with 55,000 candela and 1000+ foot range. Includes Xtar charger. 5700K cool white.',
    is_discontinued: false,
  },
  {
    brand: 'Malkoff',
    model: 'Wildcat XPL',
    slug: 'malkoff-wildcat-xpl',
    category: 'Search & Rescue',
    price_usd: 237.99,
    buy_url: 'https://malkoffdevices.com/products/wildcat-xpl-flashlight',
    max_lumens: 1100,
    min_lumens: 65,
    beam_distance_m: 46,
    beam_type: 'Flood',
    emitter: 'Cree XP-L',
    battery_type: '18650',
    battery_count: 2,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: 222,
    head_diameter_mm: 46.5,
    body_diameter_mm: 25.4,
    weight_g: null,
    material: '6061-T6 Aluminum, Type III Hard Anodized',
    ip_rating: null,
    impact_resistance_m: null,
    image_url: 'https://malkoffdevices.com/cdn/shop/products/WCXPLMD4.jpg',
    description: '1100 lumen wide-flood flashlight with 10-degree optic for room and warehouse illumination. Fully O-ringed.',
    is_discontinued: false,
  },
]

const extraImages = {
  'malkoff-mdx4-m91-hl-switch': [
    'https://malkoffdevices.com/cdn/shop/files/IMG_E8752.jpg',
    'https://malkoffdevices.com/cdn/shop/files/IMG_E8738_9cae3698-d637-4bca-a4aa-9f203ef392a6.jpg',
    'https://malkoffdevices.com/cdn/shop/files/IMG_E8740.jpg',
    'https://malkoffdevices.com/cdn/shop/files/IMG_E8739_7cfda49a-133a-46ab-829a-02625ceac398.jpg',
    'https://malkoffdevices.com/cdn/shop/files/IMG_E8741_a632fde1-19fe-49eb-b28a-4d5cce4a8682.jpg',
    'https://malkoffdevices.com/cdn/shop/files/IMG_E8732_3d8c2b74-c8da-4921-9847-768a87ca54a2.jpg',
    'https://malkoffdevices.com/cdn/shop/files/IMG_E8737.jpg',
    'https://malkoffdevices.com/cdn/shop/files/IMG_E8770.jpg',
    'https://malkoffdevices.com/cdn/shop/files/IMG_E8771.jpg',
    'https://malkoffdevices.com/cdn/shop/files/IMG_E8768.jpg',
    'https://malkoffdevices.com/cdn/shop/files/IMG_E8769.jpg',
  ],
  'malkoff-hound-dog-super': [
    'https://malkoffdevices.com/cdn/shop/products/HDSuperMD4Tricap.jpg',
    'https://malkoffdevices.com/cdn/shop/products/Hound_Dog_Super_Head_Side.jpg',
    'https://malkoffdevices.com/cdn/shop/products/Hound_Dog_Super_Head_Rear.jpg',
    'https://malkoffdevices.com/cdn/shop/products/Hound_Dog_Super_Beam_shot.jpg',
    'https://malkoffdevices.com/cdn/shop/products/Hound_Dog_Super_Front.jpg',
  ],
  'malkoff-hound-dog-xpl': [
    'https://malkoffdevices.com/cdn/shop/products/HDXPLMD4Tricap.jpg',
    'https://malkoffdevices.com/cdn/shop/products/HoundDogXP-Lside.jpg',
    'https://malkoffdevices.com/cdn/shop/products/HoundDogXP-Lfront.jpg',
    'https://malkoffdevices.com/cdn/shop/products/Wildcat_MD4_rear.jpg',
  ],
  'malkoff-turn-key-hound-dog-18650-xt-cool': [
    'https://malkoffdevices.com/cdn/shop/products/HD18650Turnkey.jpg',
    'https://malkoffdevices.com/cdn/shop/products/HoundDog18650XTTricap.jpg',
    'https://malkoffdevices.com/cdn/shop/products/MalkoffHoundDogXT_37c09b48-66c9-45cf-add5-0aa9e8586351.jpg',
    'https://malkoffdevices.com/cdn/shop/products/HoundDog18650XT150Yards.jpg',
    'https://malkoffdevices.com/cdn/shop/products/IMG_20200305_160028956.jpg',
    'https://malkoffdevices.com/cdn/shop/products/HD18650XTBeamshot.jpg',
  ],
  'malkoff-wildcat-xpl': [
    'https://malkoffdevices.com/cdn/shop/products/WCXPLMD4Tricap.jpg',
    'https://malkoffdevices.com/cdn/shop/products/MalkoffWildcatFront.jpg',
  ],
}

async function seed() {
  console.log(`Inserting ${flashlights.length} flashlights...`)

  const { data: inserted, error } = await supabase
    .from('flashlights')
    .upsert(flashlights, { onConflict: 'slug' })
    .select('id, slug')

  if (error) {
    console.error('Insert error:', error.message)
    process.exit(1)
  }

  console.log(`✓ Inserted/updated ${inserted.length} flashlights`)

  const slugToId = Object.fromEntries(inserted.map((r) => [r.slug, r.id]))

  const imageRows = []
  for (const [slug, urls] of Object.entries(extraImages)) {
    const flashlightId = slugToId[slug]
    if (!flashlightId) continue
    urls.forEach((url, i) => imageRows.push({ flashlight_id: flashlightId, url, sort_order: i }))
  }

  if (imageRows.length > 0) {
    const ids = inserted.map((r) => r.id)
    await supabase.from('flashlight_images').delete().in('flashlight_id', ids)

    const { error: imgError } = await supabase.from('flashlight_images').insert(imageRows)
    if (imgError) {
      console.error('Image insert error:', imgError.message)
    } else {
      console.log(`✓ Inserted ${imageRows.length} extra images`)
    }
  }

  console.log('Done!')
}

seed()
