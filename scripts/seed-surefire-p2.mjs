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

const img = (url) => url.replace(/\/\d+w\//, '/1280x1280/').replace(/\/\d+x\d+\//, '/1280x1280/')

const flashlights = [
  {
    brand: 'SureFire',
    model: 'P1RZ-B-DFT',
    slug: 'surefire-p1rz-b-dft',
    category: 'Tactical',
    price_usd: 289.00,
    buy_url: 'https://www.surefire.com/p1rz-b-dft/',
    max_lumens: 1500,
    min_lumens: 1100,
    beam_distance_m: 369,
    beam_type: 'Flood/Spot',
    emitter: null,
    battery_type: '18650',
    battery_count: 1,
    has_usb_charging: true,
    charging_type: 'usb',
    length_mm: 142,
    head_diameter_mm: 35,
    body_diameter_mm: null,
    weight_g: 164.3,
    material: 'Mil-Spec Hard-Anodized Aerospace Aluminum',
    ip_rating: 'IPX7',
    impact_resistance_m: null,
    image_url: img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/1051/967/P1RZ-isoL__34924.1655417049.jpg?c=2'),
    description: '1500 lumen dual-fuel combat flashlight with CombatGrip ergonomics. USB-rechargeable SF18650 or 2× CR123A.',
    is_discontinued: false,
  },
  {
    brand: 'SureFire',
    model: 'P1RZ-IB-DF',
    slug: 'surefire-p1rz-ib-df',
    category: 'Tactical',
    price_usd: 299.00,
    buy_url: 'https://www.surefire.com/p1rz-ib-df/',
    max_lumens: 1500,
    min_lumens: 15,
    beam_distance_m: 369,
    beam_type: 'Flood/Spot',
    emitter: null,
    battery_type: '18650',
    battery_count: 1,
    has_usb_charging: true,
    charging_type: 'usb',
    length_mm: 142,
    head_diameter_mm: 35,
    body_diameter_mm: null,
    weight_g: 164.3,
    material: 'Mil-Spec Hard-Anodized Aerospace Aluminum',
    ip_rating: 'IPX7',
    impact_resistance_m: null,
    image_url: img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/1280x1280/products/1028/918/P1RZ-IB-DF_isoL__85072.1642016927.jpg?c=2'),
    description: 'Auto-adjusting IntelliBeam dual-fuel combat light. 1500 lm with USB-rechargeable SF18650 or 2× CR123A.',
    is_discontinued: false,
  },
  {
    brand: 'SureFire',
    model: 'G2ZX Combat Light',
    slug: 'surefire-g2zx-combat-light',
    category: 'Tactical',
    price_usd: 137.00,
    buy_url: 'https://www.surefire.com/g2zx-combat-light/',
    max_lumens: 600,
    min_lumens: null,
    beam_distance_m: 187,
    beam_type: 'Flood/Spot',
    emitter: null,
    battery_type: 'CR123A',
    battery_count: 2,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: 132,
    head_diameter_mm: 31.75,
    body_diameter_mm: null,
    weight_g: 121,
    material: 'Polymer Body, Hard-Anodized Aluminum Bezel',
    ip_rating: null,
    impact_resistance_m: null,
    image_url: img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/528/481/G2ZX-C-BK-isoL__47013.1726248738.jpg?c=2'),
    description: '600 lumen single-output combat flashlight engineered for pistol use. Polymer body with aluminum bezel.',
    is_discontinued: false,
  },
  {
    brand: 'SureFire',
    model: 'G2Z MaxVision Combat Light',
    slug: 'surefire-g2z-maxvision-combat-light',
    category: 'Tactical',
    price_usd: 149.00,
    buy_url: 'https://www.surefire.com/g2z-maxvision-combat-light/',
    max_lumens: 800,
    min_lumens: null,
    beam_distance_m: 115,
    beam_type: 'Flood',
    emitter: null,
    battery_type: 'CR123A',
    battery_count: 2,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: 120.65,
    head_diameter_mm: 27.9,
    body_diameter_mm: null,
    weight_g: 120,
    material: 'Polymer Body, Hard-Anodized Aluminum Bezel',
    ip_rating: 'IPX7',
    impact_resistance_m: null,
    image_url: img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/527/1488/G2Z-MV-front-isoL__36178.1726248784.jpg?c=2'),
    description: '800 lumen MaxVision Beam combat light for pistol use. Wide even flood for close-range illumination.',
    is_discontinued: false,
  },
  {
    brand: 'SureFire',
    model: '6PX Pro',
    slug: 'surefire-6px-pro',
    category: 'Tactical',
    price_usd: 125.00,
    buy_url: 'https://www.surefire.com/6px-pro/',
    max_lumens: 600,
    min_lumens: 15,
    beam_distance_m: 187,
    beam_type: 'Flood/Spot',
    emitter: null,
    battery_type: 'CR123A',
    battery_count: 2,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: 131.8,
    head_diameter_mm: 31.75,
    body_diameter_mm: null,
    weight_g: 147,
    material: 'High-Strength Aerospace Aluminum, Mil-Spec Hard Anodized',
    ip_rating: 'IPX7',
    impact_resistance_m: null,
    image_url: img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/132/806/6PX-D-BK-front-isoL__36465.1587158731.jpg?c=2'),
    description: '600 lumen dual-output aluminum tactical light. Classic 6P platform with high/low mode.',
    is_discontinued: false,
  },
  {
    brand: 'SureFire',
    model: '6PX Tactical',
    slug: 'surefire-6px-tactical',
    category: 'Tactical',
    price_usd: 125.00,
    buy_url: 'https://www.surefire.com/6px-tactical/',
    max_lumens: 600,
    min_lumens: null,
    beam_distance_m: 187,
    beam_type: 'Flood/Spot',
    emitter: null,
    battery_type: 'CR123A',
    battery_count: 2,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: 132,
    head_diameter_mm: 32,
    body_diameter_mm: null,
    weight_g: 147,
    material: 'Mil-Spec Hard-Anodized Aluminum',
    ip_rating: 'IPX7',
    impact_resistance_m: null,
    image_url: img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/131/478/6PX-C-BK-isoL__41539.1631577708.jpg?c=2'),
    description: '600 lumen single-output tactical light. Classic 6P design with click tailcap switch.',
    is_discontinued: false,
  },
  {
    brand: 'SureFire',
    model: 'Aviator',
    slug: 'surefire-aviator',
    category: 'Work',
    price_usd: 329.00,
    buy_url: 'https://www.surefire.com/aviator/',
    max_lumens: 250,
    min_lumens: null,
    beam_distance_m: 190,
    beam_type: 'Flood/Spot',
    emitter: null,
    battery_type: 'CR123A',
    battery_count: 1,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: 106,
    head_diameter_mm: null,
    body_diameter_mm: null,
    weight_g: 88,
    material: 'High-Strength Aerospace Aluminum, Mil-Spec Anodized',
    ip_rating: null,
    impact_resistance_m: null,
    image_url: img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/1280x1280/products/819/386/AVIATOR-isoL__95489.1709145167.jpg?c=2'),
    description: '250 lumen multi-spectrum EDC with white + colored LED (amber/blue/red/yellow-green) in one head. Single CR123A.',
    is_discontinued: false,
  },
  {
    brand: 'SureFire',
    model: 'UDR Dominator',
    slug: 'surefire-udr-dominator',
    category: 'Search & Rescue',
    price_usd: 1600.00,
    buy_url: 'https://www.surefire.com/udr-dominator/',
    max_lumens: 4400,
    min_lumens: 40,
    beam_distance_m: 1100,
    beam_type: 'Throw',
    emitter: null,
    battery_type: 'Built-in',
    battery_count: 1,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: 295,
    head_diameter_mm: 77,
    body_diameter_mm: null,
    weight_g: 1080,
    material: 'High-Strength Aerospace Aluminum, Mil-Spec Hard Anodized',
    ip_rating: 'IPX7',
    impact_resistance_m: null,
    image_url: img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/1280x1280/products/749/1835/UDR-BK-isoL__61203.1736361438.jpg?c=2'),
    description: '4400 lumen rechargeable behemoth with 1100m beam. Portable lighthouse for military and law enforcement.',
    is_discontinued: false,
  },
]

const extraImages = {
  'surefire-g2zx-combat-light': [
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/528/1770/G2ZX_CombatLight_1-web__67155.1726156850.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/528/1771/G2ZX-C-BK-rear-isoR__89406.1726157001.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/528/1772/G2ZX-C-BK-rear-isoL__98428.1726157005.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/528/1773/G2ZX-C-BK-front-isoR__54181.1726157010.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/528/1774/G2ZX-C-BK-strap-isoL__87384.1726248736.jpg?c=2'),
  ],
  'surefire-g2z-maxvision-combat-light': [
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/527/1781/G2Z-MV-Rogers-C__43390.1726248503.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/527/1489/G2Z-MV-rear-isoL__53535.1684867039.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/527/1491/G2Z-MV-front-isoR__11472.1684867063.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/527/485/G2Z-MV-isoL__10534.1726248785.jpg?c=2'),
  ],
  'surefire-6px-pro': [
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/132/1566/6PX-D-BK-rear-isoR__71662.1684955368.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/132/1567/6PX-D-BK-rear-isoL__31751.1684955377.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/132/1568/6PX-D-BK-profile__63862.1684955380.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/132/1569/6PX-D-BK-front-isoR__10525.1684955383.jpg?c=2'),
  ],
  'surefire-6px-tactical': [
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/131/1570/6PX-C-BK-rear-isoR__12646.1684955937.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/131/1571/6PX-C-BK-rear-isoL__46351.1684955946.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/131/1572/6PX-C-BK-profile__01288.1684955948.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/160w/products/131/1573/6PX-C-BK-front-isoR__96520.1684955950.jpg?c=2'),
  ],
  'surefire-aviator': [
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/1280x1280/products/819/1802/Aviators__95694.1726526198.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/1280x1280/products/819/1778/Aviator_Red_Map-web__62524.1726183888.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/1280x1280/products/819/1779/AVIATOR_HBPD_9768__09183.1726183892.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/1280x1280/products/819/1411/AVIATOR-YG-rear-isoR__81110.1709145167.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/1280x1280/products/819/1412/AVIATOR-YG-rear-isoL__29134.1709145167.jpg?c=2'),
  ],
  'surefire-udr-dominator': [
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/1280x1280/products/749/1836/UDR-Dominator_Hero_Beam__65442.1736361452.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/1280x1280/products/749/1837/UDR-BK-profileL__22187.1736361475.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/1280x1280/products/749/1838/UDR-BK-charging-port__17863.1736361485.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/1280x1280/products/749/1839/UDR-BK-profileR__64723.1736361502.jpg?c=2'),
    img('https://cdn11.bigcommerce.com/s-fecqh2764q/images/stencil/1280x1280/products/749/1840/UDR-BK-isoR__56817.1736361512.jpg?c=2'),
  ],
}

async function seed() {
  console.log(`Inserting ${flashlights.length} SureFire flashlights (page 2)...`)

  const { data: inserted, error } = await supabase
    .from('flashlights')
    .upsert(flashlights, { onConflict: 'slug' })
    .select('id, slug')

  if (error) { console.error('Insert error:', error.message); process.exit(1) }
  console.log(`✓ Inserted/updated ${inserted.length} flashlights`)

  const slugToId = Object.fromEntries(inserted.map((r) => [r.slug, r.id]))
  const imageRows = []
  for (const [slug, urls] of Object.entries(extraImages)) {
    const id = slugToId[slug]
    if (!id) continue
    urls.forEach((url, i) => imageRows.push({ flashlight_id: id, url, sort_order: i }))
  }

  if (imageRows.length > 0) {
    await supabase.from('flashlight_images').delete().in('flashlight_id', inserted.map((r) => r.id))
    const { error: imgErr } = await supabase.from('flashlight_images').insert(imageRows)
    if (imgErr) console.error('Image error:', imgErr.message)
    else console.log(`✓ Inserted ${imageRows.length} extra images`)
  }

  console.log('Done!')
}

seed()
