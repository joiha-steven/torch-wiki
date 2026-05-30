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
    model: 'MDC HTL V3 EZP',
    slug: 'malkoff-mdc-htl-v3-ezp',
    category: 'EDC',
    price_usd: 239.99,
    buy_url: 'https://malkoffdevices.com/products/mdc-htl-v3-ezp-flashlight',
    max_lumens: 1050,
    min_lumens: 8,
    beam_distance_m: 183,
    beam_type: 'Flood/Spot',
    emitter: null,
    battery_type: '18650',
    battery_count: 1,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: 127,
    head_diameter_mm: 28,
    body_diameter_mm: 22.6,
    weight_g: null,
    material: '6061-T6 Aluminum, Type III Hard Anodized',
    ip_rating: null,
    impact_resistance_m: null,
    image_url: 'https://malkoffdevices.com/cdn/shop/files/MalkoffHTLFlashlight_24beda21-a7e4-4ebd-8bca-cb7f2a3478fa.jpg',
    description: 'Programmable EDC 18650 flashlight with 1050 lumens, user-configurable modes, and titanium clip option.',
    is_discontinued: false,
  },
  {
    brand: 'Malkoff',
    model: 'MDX21700 M61',
    slug: 'malkoff-mdx21700-m61',
    category: 'EDC',
    price_usd: 192.99,
    buy_url: 'https://malkoffdevices.com/products/mdx21700-m61-flashlight',
    max_lumens: 750,
    min_lumens: null,
    beam_distance_m: null,
    beam_type: null,
    emitter: 'Malkoff M61 SHO',
    battery_type: '21700',
    battery_count: 1,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: null,
    head_diameter_mm: null,
    body_diameter_mm: null,
    weight_g: null,
    material: 'Type III Hard Anodized Aluminum',
    ip_rating: null,
    impact_resistance_m: null,
    image_url: 'https://malkoffdevices.com/cdn/shop/files/Capturedaignalfinalyes.png',
    description: 'Rugged 21700-compatible flashlight with Malkoff M61 module. Built for hard use.',
    is_discontinued: false,
  },
  {
    brand: 'Malkoff',
    model: 'MDC E2XTL V3 EZP',
    slug: 'malkoff-mdc-e2xtl-v3-ezp',
    category: 'Thrower',
    price_usd: 249.99,
    buy_url: 'https://malkoffdevices.com/products/mdc-e2xtl-v3-ezp-flashlight',
    max_lumens: 1050,
    min_lumens: 8,
    beam_distance_m: null,
    beam_type: 'Throw',
    emitter: null,
    battery_type: '18650',
    battery_count: 1,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: 133.4,
    head_diameter_mm: 31.2,
    body_diameter_mm: 22.6,
    weight_g: null,
    material: '6061-T6 Aluminum, Type III Hard Anodized',
    ip_rating: null,
    impact_resistance_m: null,
    image_url: 'https://malkoffdevices.com/cdn/shop/files/MDCPocketThrower.jpg',
    description: 'Programmable pocket thrower with 1050 lumens, reaching 1000+ feet. 5700K cool white.',
    is_discontinued: false,
  },
  {
    brand: 'Malkoff',
    model: 'MDX2 M61 High/Low Switch',
    slug: 'malkoff-mdx2-m61-high-low-switch',
    category: 'Tactical',
    price_usd: 193.99,
    buy_url: 'https://malkoffdevices.com/products/mdx2-m61-high-low-switch-flashlight',
    max_lumens: 750,
    min_lumens: null,
    beam_distance_m: null,
    beam_type: null,
    emitter: 'Malkoff M61 SHO',
    battery_type: '18650',
    battery_count: 1,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: null,
    head_diameter_mm: null,
    body_diameter_mm: null,
    weight_g: null,
    material: 'Type III Hard Anodized Aluminum',
    ip_rating: null,
    impact_resistance_m: null,
    image_url: 'https://malkoffdevices.com/cdn/shop/products/NewMD2StandardHeadside.jpg',
    description: 'MDX2 platform with M61 module and integrated high/low head-rotation switch for quick output control.',
    is_discontinued: false,
  },
  {
    brand: 'Malkoff',
    model: 'MDX2 M61',
    slug: 'malkoff-mdx2-m61',
    category: 'Tactical',
    price_usd: 168.99,
    buy_url: 'https://malkoffdevices.com/products/m61-mdx2-flashlight',
    max_lumens: 750,
    min_lumens: null,
    beam_distance_m: null,
    beam_type: null,
    emitter: 'Malkoff M61 SHO',
    battery_type: '18650',
    battery_count: 1,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: null,
    head_diameter_mm: null,
    body_diameter_mm: null,
    weight_g: null,
    material: 'Type III Hard Anodized Aluminum',
    ip_rating: null,
    impact_resistance_m: null,
    image_url: 'https://malkoffdevices.com/cdn/shop/products/IMG_20210216_165624822.jpg',
    description: 'MDX2 body with Malkoff M61 SHO module. Forward clicky switch with momentary. Lifetime warranty.',
    is_discontinued: false,
  },
  {
    brand: 'Malkoff',
    model: 'MDX2 M61HOT V2',
    slug: 'malkoff-mdx2-m61hot-v2',
    category: 'Thrower',
    price_usd: 175.99,
    buy_url: 'https://malkoffdevices.com/products/mdx2-m61hot-v2-flashlight',
    max_lumens: 800,
    min_lumens: 5,
    beam_distance_m: 55,
    beam_type: 'Throw',
    emitter: null,
    battery_type: '18650',
    battery_count: 1,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: 129.5,
    head_diameter_mm: 31,
    body_diameter_mm: 25.4,
    weight_g: null,
    material: 'Aluminum',
    ip_rating: null,
    impact_resistance_m: null,
    image_url: 'https://malkoffdevices.com/cdn/shop/products/NewMD2StandardHeadside_b345de6b-6e64-42b6-8e71-e06910951426.jpg',
    description: '800 lumen thrower with tightly focused TIR optic and 33,000 candela. 5700K cool white.',
    is_discontinued: false,
  },
  {
    brand: 'Malkoff',
    model: 'MDX2 M61T',
    slug: 'malkoff-mdx2-m61t',
    category: 'Thrower',
    price_usd: 169.99,
    buy_url: 'https://malkoffdevices.com/products/mdx2-m61t-flashlight',
    max_lumens: 480,
    min_lumens: 18,
    beam_distance_m: 137,
    beam_type: 'Throw',
    emitter: 'Cree XP-L HI',
    battery_type: 'CR123A',
    battery_count: 2,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: null,
    head_diameter_mm: null,
    body_diameter_mm: null,
    weight_g: null,
    material: 'Aluminum',
    ip_rating: null,
    impact_resistance_m: null,
    image_url: 'https://malkoffdevices.com/cdn/shop/products/NewMD2StandardHeadside_a92f7300-9ab6-445a-9d8d-a336a068cf53.jpg',
    description: 'Long-range tactical thrower with Cree XP-L HI, 20K candela, and 450+ foot beam. Fully potted.',
    is_discontinued: false,
  },
  {
    brand: 'Malkoff',
    model: 'MDC Bodyguard V2 18650',
    slug: 'malkoff-mdc-bodyguard-v2-18650',
    category: 'Tactical',
    price_usd: 199.99,
    buy_url: 'https://malkoffdevices.com/products/mdc-bodyguard-v2-18650-flashlight',
    max_lumens: 1000,
    min_lumens: 250,
    beam_distance_m: null,
    beam_type: 'Flood/Spot',
    emitter: 'Cree XP-L',
    battery_type: '18650',
    battery_count: 1,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: 133.4,
    head_diameter_mm: 25.4,
    body_diameter_mm: 22.6,
    weight_g: null,
    material: 'Type III Hard Anodized Aluminum',
    ip_rating: null,
    impact_resistance_m: null,
    image_url: 'https://malkoffdevices.com/cdn/shop/products/Malkoff_MDC_Bodyguard_V2_18650_Side.jpg',
    description: 'Tactical EDC with 1000 lumens, auto stepdown after 8s, and TIR optic for balanced beam. Lifetime warranty.',
    is_discontinued: false,
  },
  {
    brand: 'Malkoff',
    model: 'MDX2 365nm UV',
    slug: 'malkoff-mdx2-365nm-uv',
    category: 'Work',
    price_usd: 195.99,
    buy_url: 'https://malkoffdevices.com/products/md2-365nm-uv-flashlight',
    max_lumens: null,
    min_lumens: null,
    beam_distance_m: null,
    beam_type: 'Flood',
    emitter: 'SST-10-UV',
    battery_type: 'CR123A',
    battery_count: 2,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: 129.5,
    head_diameter_mm: 31,
    body_diameter_mm: 25.4,
    weight_g: null,
    material: '6061-T6 Aluminum, Type III Hard Anodized',
    ip_rating: null,
    impact_resistance_m: null,
    image_url: 'https://malkoffdevices.com/cdn/shop/products/MD2UVside.jpg',
    description: '365nm UV flashlight with 1800mW output for forensic, leak detection, and currency verification.',
    is_discontinued: false,
  },
]

const extraImages = {
  'malkoff-mdc-htl-v3-ezp': [
    'https://malkoffdevices.com/cdn/shop/files/MalkoffHTLFlashlightfront.jpg',
    'https://malkoffdevices.com/cdn/shop/files/MalkoffHTLFlashlightrear.jpg',
    'https://malkoffdevices.com/cdn/shop/files/MalkoffHTLFlashlightCap.jpg',
    'https://malkoffdevices.com/cdn/shop/files/IMG_E9409.jpg',
  ],
  'malkoff-mdx21700-m61': [
    'https://malkoffdevices.com/cdn/shop/files/Capture0001.png',
    'https://malkoffdevices.com/cdn/shop/files/Capture4_a5778aba-162f-4154-b7a2-7944f087440c.png',
    'https://malkoffdevices.com/cdn/shop/files/Capture6.png',
    'https://malkoffdevices.com/cdn/shop/files/Capture5.png',
  ],
  'malkoff-mdc-e2xtl-v3-ezp': [
    'https://malkoffdevices.com/cdn/shop/files/MDC18650DFBodyE2XTLcapclip_8eafd783-93fa-445b-95ea-27319946b39f.jpg',
    'https://malkoffdevices.com/cdn/shop/files/IMG_E9409_0983cb73-f5f9-44df-9342-645608144366.jpg',
  ],
  'malkoff-mdx2-m61-high-low-switch': [
    'https://malkoffdevices.com/cdn/shop/products/NewMD2CrenellatedHeadside.jpg',
    'https://malkoffdevices.com/cdn/shop/products/MD2M61Tricapside.jpg',
    'https://malkoffdevices.com/cdn/shop/products/MD2M61CrenellatedTricapside.jpg',
  ],
  'malkoff-mdx2-m61': [
    'https://malkoffdevices.com/cdn/shop/products/IMG_20210216_165657125.jpg',
    'https://malkoffdevices.com/cdn/shop/products/MD2M61Tricapside_a313c209-050e-4044-ad7e-3b8a6a40a3f4.jpg',
    'https://malkoffdevices.com/cdn/shop/products/MD2M61CrenellatedTricapside_9c908444-b68b-454b-9ec5-29db3f0a895e.jpg',
  ],
  'malkoff-mdx2-m61hot-v2': [
    'https://malkoffdevices.com/cdn/shop/products/NewMD2M61T-HOTfront_a6b2d751-16f0-42f8-9a34-c0da49266ed3.jpg',
    'https://malkoffdevices.com/cdn/shop/products/M61HOTMD2side.jpg',
    'https://malkoffdevices.com/cdn/shop/files/NewMD2CrenellatedHeadside_800x800_cd489372-95d5-44d9-9785-350f982fb4c5.jpg',
    'https://malkoffdevices.com/cdn/shop/files/MD2M61CrenellatedTricapside_800x800_74308985-cc9e-45ba-b10c-42967d2283ab.jpg',
  ],
  'malkoff-mdx2-m61t': [
    'https://malkoffdevices.com/cdn/shop/products/NewMD2M61T-HOTfront.jpg',
    'https://malkoffdevices.com/cdn/shop/products/MD2M61Tricapside_6b768419-f50e-467f-9012-07cb1c9a1c5a.jpg',
  ],
  'malkoff-mdc-bodyguard-v2-18650': [
    'https://malkoffdevices.com/cdn/shop/products/Malkoff_MDC_Bodyguard_V2_18650_Apart2.jpg',
    'https://malkoffdevices.com/cdn/shop/products/Malkoff_MDC_Bodyguard_V2_18650_Apart.jpg',
    'https://malkoffdevices.com/cdn/shop/products/Malkoff_MDC_Bodyguard_V2_18650_Front.jpg',
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
    urls.forEach((url, i) => {
      imageRows.push({ flashlight_id: flashlightId, url, sort_order: i })
    })
  }

  if (imageRows.length > 0) {
    const ids = inserted.map((r) => r.id)
    await supabase.from('flashlight_images').delete().in('flashlight_id', ids)

    const { error: imgError } = await supabase
      .from('flashlight_images')
      .insert(imageRows)

    if (imgError) {
      console.error('Image insert error:', imgError.message)
    } else {
      console.log(`✓ Inserted ${imageRows.length} extra images`)
    }
  }

  console.log('Done!')
}

seed()
