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

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)
const BLOB_TOKEN = env.BLOB_READ_WRITE_TOKEN

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

// Convert protocol-relative URLs and upgrade Shopify CDN to 1024x1024
function img(url) {
  return url
    .replace(/^\/\//, 'https://')
    .replace(/(_480x480)(\.(jpg|png|webp|jpeg)(\?[^"]*)?)/gi, '_1024x1024$2')
}

function getExt(url) {
  try {
    const p = new URL(url).pathname.split('?')[0]
    const ext = p.split('.').pop()
    return ext && ext.length <= 5 ? `.${ext}` : '.jpg'
  } catch { return '.jpg' }
}

function isAlreadyBlob(url) {
  return url && (url.includes('vercel-storage.com') || url.includes('blob.vercel'))
}

async function downloadImage(url) {
  await delay(500)
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.imalentstore.com/',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return { buf: await res.arrayBuffer(), ct: res.headers.get('content-type') ?? 'image/jpeg' }
}

async function uploadToBlob(buf, ct, blobPath) {
  const { url } = await put(blobPath, buf, { access: 'public', token: BLOB_TOKEN, contentType: ct })
  return url
}

// ─── Flashlight data ─────────────────────────────────────────────────────────

const flashlights = [
  {
    brand: 'Imalent',
    model: 'GR35',
    slug: 'imalent-gr35',
    category: 'EDC',
    price_usd: 66.95,
    buy_url: 'https://www.imalentstore.com/products/imalent-gr35-4-in-1-edc-flashlight',
    max_lumens: 2800,
    min_lumens: null,
    beam_distance_m: 426,
    beam_type: 'Flood/Spot',
    emitter: null,
    battery_type: 'Built-in',
    battery_count: 1,
    has_usb_charging: false,
    charging_type: 'magnetic',
    length_mm: null,
    head_diameter_mm: null,
    body_diameter_mm: null,
    weight_g: null,
    material: 'Aerospace-grade aluminum',
    ip_rating: 'IPX7',
    impact_resistance_m: null,
    image_url: img('//www.imalentstore.com/cdn/shop/files/001_1024x1024.jpg?v=1745290135'),
    description: '4-in-1 multi-source EDC: 2800-lumen white beam, green/red laser, 365nm UV, and emergency red/blue signals. Recharges via magnetic case that doubles as a power bank.',
    is_discontinued: false,
  },
  {
    brand: 'Imalent',
    model: 'SR32',
    slug: 'imalent-sr32',
    category: 'Search & Rescue',
    price_usd: 679.95,
    buy_url: 'https://www.imalentstore.com/products/imalent-sr32-120000-lumen-flashlight',
    max_lumens: 120000,
    min_lumens: 30,
    beam_distance_m: 2080,
    beam_type: 'Throw',
    emitter: '32× CREE XHP50.3 Hi',
    battery_type: '21700',
    battery_count: 8,
    has_usb_charging: true,
    charging_type: 'usb',
    length_mm: 220,
    head_diameter_mm: 138,
    body_diameter_mm: 56,
    weight_g: 2166,
    material: 'Aerospace-grade aluminum alloy',
    ip_rating: 'IP56',
    impact_resistance_m: 0.5,
    image_url: img('//www.imalentstore.com/cdn/shop/products/imalent-sr32-brightest-flashlightimalent-584110_1024x1024.jpg?v=1682157848'),
    description: 'Long-throw searchlight projecting 120,000 lumens to 2080m. Active cooling fans, OLED display, and 100W USB-C charges 8× 21700 cells in 90 minutes.',
    is_discontinued: false,
  },
  {
    brand: 'Imalent',
    model: 'MS32',
    slug: 'imalent-ms32',
    category: 'Search & Rescue',
    price_usd: 674.96,
    buy_url: 'https://www.imalentstore.com/products/imalent-ms32-200000-lumen-flashlight',
    max_lumens: 200000,
    min_lumens: 80,
    beam_distance_m: 1618,
    beam_type: 'Flood/Spot',
    emitter: '32× CREE XHP70.2',
    battery_type: '21700',
    battery_count: 12,
    has_usb_charging: true,
    charging_type: 'usb',
    length_mm: 242,
    head_diameter_mm: 149,
    body_diameter_mm: 67.5,
    weight_g: 3096,
    material: 'Aerospace-grade aluminum alloy',
    ip_rating: 'IP56',
    impact_resistance_m: 0.5,
    image_url: img('//www.imalentstore.com/cdn/shop/products/imalent-ms32-brightest-flashlightimalent-650066_1024x1024.jpg?v=1774574958'),
    description: '200,000-lumen output with 655,000cd peak intensity from 32 CREE XHP70.2 LEDs. Active cooling, OLED display, and 100W USB-C charging.',
    is_discontinued: false,
  },
  {
    brand: 'Imalent',
    model: 'MS03',
    slug: 'imalent-ms03',
    category: 'EDC',
    price_usd: 129.95,
    buy_url: 'https://www.imalentstore.com/products/imalent-ms03-13000-lumen-flashlight',
    max_lumens: 13000,
    min_lumens: 150,
    beam_distance_m: 324,
    beam_type: 'Flood/Spot',
    emitter: '3× CREE XHP70.2',
    battery_type: '21700',
    battery_count: 1,
    has_usb_charging: true,
    charging_type: 'usb',
    length_mm: 110,
    head_diameter_mm: 36,
    body_diameter_mm: 27,
    weight_g: 187,
    material: 'Aerospace-grade aluminum alloy',
    ip_rating: 'IPX8',
    impact_resistance_m: 1.5,
    image_url: img('//www.imalentstore.com/cdn/shop/products/1_96b7d191-a417-453a-9989-800b4a236865-375922_1024x1024.jpg?v=1655863489'),
    description: 'Compact 13,000-lumen EDC powered by three CREE XHP70.2 LEDs in a 110mm body. IPX8 waterproof, USB-C fast charging, available in cool or warm white.',
    is_discontinued: false,
  },
  {
    brand: 'Imalent',
    model: 'BL70',
    slug: 'imalent-bl70',
    category: 'EDC',
    price_usd: 79.95,
    buy_url: 'https://www.imalentstore.com/products/imalent-bl70-powerful-edc-flashlight',
    max_lumens: 6000,
    min_lumens: 10,
    beam_distance_m: 347,
    beam_type: 'Flood/Spot',
    emitter: 'CREE XHP70.2 HI',
    battery_type: '18650',
    battery_count: 1,
    has_usb_charging: true,
    charging_type: 'usb',
    length_mm: 93.5,
    head_diameter_mm: null,
    body_diameter_mm: 34.5,
    weight_g: 148,
    material: 'Aerospace-grade aluminum alloy, Type III hard-anodized',
    ip_rating: 'IP68',
    impact_resistance_m: 1.5,
    image_url: img('//www.imalentstore.com/cdn/shop/files/imalent-bl70-powerful-edc-flashlightimalent-928794_1024x1024.jpg'),
    description: '6000-lumen EDC with OLED display, secondary red light source, tactical tail switch, and IP68 waterproofing. Charges via USB-C in 1.5 hours.',
    is_discontinued: false,
  },
  {
    brand: 'Imalent',
    model: 'LD70',
    slug: 'imalent-ld70',
    category: 'EDC',
    price_usd: 59.95,
    buy_url: 'https://www.imalentstore.com/products/imalent-ld70-4000-lumen-flashlight',
    max_lumens: 4000,
    min_lumens: 20,
    beam_distance_m: 203,
    beam_type: 'Flood/Spot',
    emitter: 'CREE XHP70.2',
    battery_type: 'Built-in',
    battery_count: 1,
    has_usb_charging: false,
    charging_type: 'magnetic',
    length_mm: 81,
    head_diameter_mm: 25,
    body_diameter_mm: 25,
    weight_g: 87,
    material: 'Aerospace-grade aluminum alloy',
    ip_rating: 'IPX8',
    impact_resistance_m: 1.5,
    image_url: img('//www.imalentstore.com/cdn/shop/products/1_36a117e3-c8a3-4f36-ad4c-9a1612d392ac-570413_480x480.jpg'),
    description: 'Ultra-compact 4000-lumen EDC at 81mm and 87g. Built-in 18350 cell with magnetic charging, OLED display, IPX8 waterproofing. Available in four colors.',
    is_discontinued: false,
  },
  {
    brand: 'Imalent',
    model: 'MS18',
    slug: 'imalent-ms18',
    category: 'Search & Rescue',
    price_usd: 669.95,
    buy_url: 'https://www.imalentstore.com/products/imalent-ms18-100000-lumen-flashlight',
    max_lumens: 100000,
    min_lumens: 700,
    beam_distance_m: 1350,
    beam_type: 'Flood/Spot',
    emitter: '18× CREE XHP70 2nd',
    battery_type: '21700',
    battery_count: 8,
    has_usb_charging: false,
    charging_type: 'none',
    length_mm: 265,
    head_diameter_mm: 129,
    body_diameter_mm: 59,
    weight_g: 1900,
    material: 'Aerospace-grade aluminum alloy, Type III hard-anodized',
    ip_rating: 'IP56',
    impact_resistance_m: 1.5,
    image_url: img('//www.imalentstore.com/cdn/shop/products/imalent-ms18-brightest-flashlightimalent-999876_480x480.jpg?v=1699952198'),
    description: '100,000-lumen predecessor to the MS32, driven by 18 CREE XHP70 LEDs. Active cooling, OLED display, up to 14h52min runtime. Charges via proprietary DC adapter.',
    is_discontinued: true,
  },
  {
    brand: 'Imalent',
    model: 'MS12',
    slug: 'imalent-ms12',
    category: 'Search & Rescue',
    price_usd: 409.95,
    buy_url: 'https://www.imalentstore.com/products/imalent-ms12-led-flashlight',
    max_lumens: 65000,
    min_lumens: 50,
    beam_distance_m: 1036,
    beam_type: 'Flood/Spot',
    emitter: '12× CREE XHP70.2',
    battery_type: 'Built-in',
    battery_count: 1,
    has_usb_charging: true,
    charging_type: 'usb',
    length_mm: 149,
    head_diameter_mm: 83,
    body_diameter_mm: 56,
    weight_g: 787,
    material: 'Aerospace-grade aluminum alloy',
    ip_rating: 'IP56',
    impact_resistance_m: 1,
    image_url: img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-770694_480x480.jpg?v=1703675345'),
    description: '65,000-lumen searchlight with 12 CREE XHP70.2 LEDs, detachable heat-insulated handle, and 65W USB-C PD charging in one hour.',
    is_discontinued: false,
  },
  {
    brand: 'Imalent',
    model: 'SR16',
    slug: 'imalent-sr16',
    category: 'Search & Rescue',
    price_usd: 369.95,
    buy_url: 'https://www.imalentstore.com/products/imalent-sr16-55000-lumen-flashlight',
    max_lumens: 55000,
    min_lumens: 50,
    beam_distance_m: 1715,
    beam_type: 'Throw',
    emitter: '16× CREE XHP50.3 HI',
    battery_type: '21700',
    battery_count: 4,
    has_usb_charging: true,
    charging_type: 'usb',
    length_mm: 158,
    head_diameter_mm: 109,
    body_diameter_mm: 56,
    weight_g: 1130,
    material: 'Aerospace-grade aluminum alloy',
    ip_rating: 'IP56',
    impact_resistance_m: 0.5,
    image_url: img('//www.imalentstore.com/cdn/shop/products/imalent-sr16-55000-lumen-flashlightimalent-596528_480x480.jpg?v=1664528382'),
    description: '55,000-lumen searchlight with 1715m range and 16 CREE XHP50.3 HI LEDs. Built-in charger, removable metal handle, up to 98 hours runtime on moonlight.',
    is_discontinued: false,
  },
  {
    brand: 'Imalent',
    model: 'LD35',
    slug: 'imalent-ld35',
    category: 'EDC',
    price_usd: 59.95,
    buy_url: 'https://www.imalentstore.com/products/imalent-ld35-rechargeable-edc-flashlight',
    max_lumens: 1200,
    min_lumens: 5,
    beam_distance_m: 328,
    beam_type: 'Throw',
    emitter: 'Luminus SFT-25R',
    battery_type: 'Built-in',
    battery_count: 1,
    has_usb_charging: true,
    charging_type: 'usb',
    length_mm: 81,
    head_diameter_mm: 25,
    body_diameter_mm: 25,
    weight_g: 87,
    material: 'Aerospace-grade aluminum alloy',
    ip_rating: 'IP68',
    impact_resistance_m: 1.5,
    image_url: img('//www.imalentstore.com/cdn/shop/files/imalent-ld35-rechargeable-edc-flashlightimalent-991354_1024x1024.jpg?v=1728364012'),
    description: 'Compact 1200-lumen thrower at 81mm and 87g. Luminus SFT-25R LED delivers 328m range. Built-in 18350, USB-C, includes wireless charging box.',
    is_discontinued: false,
  },
  {
    brand: 'Imalent',
    model: 'BL50',
    slug: 'imalent-bl50',
    category: 'EDC',
    price_usd: 69.95,
    buy_url: 'https://www.imalentstore.com/products/dual-light-sources-edc-flashlight-imalent-bl50',
    max_lumens: 3600,
    min_lumens: 5,
    beam_distance_m: 428,
    beam_type: 'Flood/Spot',
    emitter: 'CREE XHP50.3 HI + 365nm UV',
    battery_type: '18650',
    battery_count: 1,
    has_usb_charging: true,
    charging_type: 'usb',
    length_mm: null,
    head_diameter_mm: null,
    body_diameter_mm: 34.5,
    weight_g: 158,
    material: 'Aerospace-grade aluminum alloy',
    ip_rating: 'IPX8',
    impact_resistance_m: 1.5,
    image_url: img('//www.imalentstore.com/cdn/shop/products/dual-light-sources-edc-flashlight-imalent-bl50imalent-188684_1024x1024.jpg'),
    description: '3600-lumen EDC with dual sources: a CREE XHP50.3 HI main beam plus a 698mW 365nm UV LED for counterfeit detection, mineral hunting, and pet stain finding.',
    is_discontinued: false,
  },
  {
    brand: 'Imalent',
    model: 'MR90',
    slug: 'imalent-mr90',
    category: 'Search & Rescue',
    price_usd: 359.95,
    buy_url: 'https://www.imalentstore.com/products/imalent-mr90-50000-lumen-flashlight',
    max_lumens: 50000,
    min_lumens: 2500,
    beam_distance_m: 1586,
    beam_type: 'Flood/Spot',
    emitter: '8× CREE XHP70.2 + 1× Luminus SBT90.3',
    battery_type: '21700',
    battery_count: 4,
    has_usb_charging: true,
    charging_type: 'usb',
    length_mm: 152,
    head_diameter_mm: 92,
    body_diameter_mm: 56,
    weight_g: 898,
    material: 'Aerospace-grade aluminum alloy',
    ip_rating: 'IP56',
    impact_resistance_m: 1,
    image_url: img('//www.imalentstore.com/cdn/shop/products/1-1-792237_1024x1024.jpg?v=1655863446'),
    description: '50,000-lumen dual-beam searchlight with switchable flood, spot, and mix modes via a dedicated throw LED (SBT90.3) alongside eight XHP70.2 flood LEDs.',
    is_discontinued: true,
  },
  {
    brand: 'Imalent',
    model: 'GR36',
    slug: 'imalent-gr36',
    category: 'EDC',
    price_usd: 59.95,
    buy_url: 'https://www.imalentstore.com/products/imalent-gr36-new-peak-clip-flashlight',
    max_lumens: 2800,
    min_lumens: null,
    beam_distance_m: 486,
    beam_type: 'Flood/Spot',
    emitter: null,
    battery_type: 'Built-in',
    battery_count: 1,
    has_usb_charging: true,
    charging_type: 'usb',
    length_mm: null,
    head_diameter_mm: null,
    body_diameter_mm: null,
    weight_g: null,
    material: 'Aerospace-grade aluminum',
    ip_rating: 'IP56',
    impact_resistance_m: 1,
    image_url: img('//www.imalentstore.com/cdn/shop/files/imalent-gr36-new-peak-clip-flashlightimalent-6368858_480x480.jpg?v=1755791453'),
    description: 'Triple-source EDC with cool white, warm white, and 365nm UV beams. Dual-dial interface, pocket clip, and magnetic tail cap for hands-free use.',
    is_discontinued: false,
  },
]

// ─── Extra images ─────────────────────────────────────────────────────────────

const extraImages = {
  'imalent-gr35': [
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-691264_480x480.jpg?v=1745293424'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-648168_480x480.jpg?v=1745293424'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-777237_480x480.jpg?v=1745293424'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-146121_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-507734_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-584160_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-806232_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-704812_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-531835_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-549643_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-520659_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-228987_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-820634_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-536087_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-321680_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-790850_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-651529_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-474613_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-527035_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-772679_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-501352_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-132154_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-922104_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-211452_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr35-4-in-1-edc-flashlightimalent-427337_480x480.jpg?v=1745290135'),
    img('//www.imalentstore.com/cdn/shop/files/005_480x480.jpg?v=1745290135'),
  ],
  'imalent-sr32': [
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr32-120000-lumen-powerful-flashlightimalent-328897_480x480.jpg?v=1682159434'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr32-120000-lumen-powerful-flashlightimalent-752247_480x480.jpg?v=1682159434'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr32-120000-lumen-powerful-flashlightimalent-303684_480x480.jpg?v=1682159434'),
    img('//www.imalentstore.com/cdn/shop/files/SR32-1200X1200_-4_480x480.jpg?v=1754640441'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr32-120000-lumen-powerful-flashlightimalent-244827_480x480.jpg?v=1754640441'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr32-120000-lumen-powerful-flashlightimalent-853117_480x480.jpg?v=1754640441'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr32-120000-lumen-powerful-flashlightimalent-536265_480x480.jpg?v=1754640441'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr32-120000-lumen-powerful-flashlightimalent-910393_480x480.jpg?v=1754640441'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr32-120000-lumen-powerful-flashlightimalent-588729_480x480.jpg?v=1754640441'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr32-120000-lumen-powerful-flashlightimalent-144288_480x480.jpg?v=1754640441'),
    img('//www.imalentstore.com/cdn/shop/files/SR32-1200X1200_-11_480x480.jpg?v=1754640441'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr32-120000-lumen-powerful-flashlightimalent-510052_480x480.jpg?v=1754640441'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr32-120000-lumen-powerful-flashlightimalent-369496_480x480.jpg?v=1754640441'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr32-120000-lumen-powerful-flashlightimalent-177216_480x480.jpg?v=1754640441'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr32-120000-lumen-powerful-flashlightimalent-100633_480x480.jpg?v=1754640441'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr32-120000-lumen-powerful-flashlightimalent-356689_480x480.jpg?v=1754640441'),
    img('//www.imalentstore.com/cdn/shop/files/SR32-1200X1200_-17_480x480.jpg?v=1754640441'),
    img('//www.imalentstore.com/cdn/shop/files/SR32-1200X1200_-18_480x480.jpg?v=1754640441'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr32-brightest-flashlightimalent-925464_480x480.jpg?v=1754640441'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr32-120000-lumen-powerful-flashlightimalent-371851_480x480.jpg?v=1754640441'),
  ],
  'imalent-ms32': [
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms32-brightest-flashlightimalent-163411_480x480.jpg?v=1774574958'),
    img('//www.imalentstore.com/cdn/shop/files/MS32-01_480x480.jpg?v=1774574958'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms32-brightest-flashlightimalent-120007_480x480.jpg?v=1774574958'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms32-brightest-flashlightimalent-735985_480x480.jpg?v=1774574958'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms32-brightest-flashlightimalent-265226_480x480.jpg?v=1774574958'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms32-brightest-flashlightimalent-315137_480x480.jpg?v=1774574958'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms32-brightest-flashlightimalent-219759_480x480.jpg?v=1774574958'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms32-brightest-flashlightimalent-843593_480x480.jpg?v=1774574958'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms32-brightest-flashlightimalent-504871_480x480.jpg?v=1774574958'),
    img('//www.imalentstore.com/cdn/shop/files/MS32-09_480x480.jpg?v=1774574958'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms32-brightest-flashlightimalent-799205_480x480.jpg?v=1774574958'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms32-brightest-flashlightimalent-510033_480x480.jpg?v=1774574958'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms32-brightest-flashlightimalent-987487_480x480.jpg?v=1774574958'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms32-brightest-flashlightimalent-990534_480x480.jpg?v=1774574958'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms32-brightest-flashlightimalent-708528_480x480.jpg?v=1774574958'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms32-brightest-flashlightimalent-450682_480x480.jpg?v=1774574958'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms32-brightest-flashlightimalent-909317_480x480.jpg?v=1774574958'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms32-brightest-flashlightimalent-909140_480x480.jpg?v=1774574958'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms32-brightest-flashlightimalent-509537_480x480.jpg?v=1774574958'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms32-brightest-flashlightimalent-757554_480x480.jpg?v=1774574958'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms32-brightest-flashlightimalent-239260_480x480.jpg?v=1774574958'),
  ],
  'imalent-ms03': [
    img('//www.imalentstore.com/cdn/shop/products/2_2918c19b-1562-4ef6-aa61-feb58e371703-788337_480x480.jpg?v=1655863489'),
    img('//www.imalentstore.com/cdn/shop/products/brightest-edc-flashlight-imalent-ms03imalent-666276_480x480.webp?v=1689820784'),
    img('//www.imalentstore.com/cdn/shop/products/imalentms03_480x480.jpg?v=1689820560'),
    img('//www.imalentstore.com/cdn/shop/products/2_93d69f42-613f-4750-8376-79ba90d7261f_480x480.jpg?v=1689820560'),
    img('//www.imalentstore.com/cdn/shop/products/4_8d903fcf-ae24-48ab-aa96-b5d4e663e46c_480x480.jpg?v=1689820560'),
    img('//www.imalentstore.com/cdn/shop/products/5_8fa648db-c0e1-4740-90bd-476289d39f81_480x480.jpg?v=1689820560'),
    img('//www.imalentstore.com/cdn/shop/products/6_0f635ecb-9f17-42e3-a75e-0ffbb4e1c6a9_480x480.jpg?v=1689820560'),
    img('//www.imalentstore.com/cdn/shop/products/7_edf134b5-3c8c-4c6a-bc3b-12550cfba4f8_480x480.jpg?v=1689820560'),
    img('//www.imalentstore.com/cdn/shop/products/8_b0dd271b-1f77-4fb4-8b68-703a5106a4ae_480x480.jpg?v=1689820560'),
    img('//www.imalentstore.com/cdn/shop/products/9_f04713f2-5adc-4c75-826e-5e9972e30b40_480x480.jpg?v=1689820560'),
    img('//www.imalentstore.com/cdn/shop/products/11_33ae87c0-f29c-4023-aff5-5a94079e15bc_480x480.jpg?v=1689820560'),
    img('//www.imalentstore.com/cdn/shop/products/12_2ea616af-26cd-4deb-b9b5-82f9734a5a30_480x480.jpg?v=1689820560'),
    img('//www.imalentstore.com/cdn/shop/products/15_56b7fe09-f123-4707-8d5d-d3776eb72bc1_480x480.jpg?v=1689820560'),
  ],
  'imalent-bl70': [
    img('//www.imalentstore.com/cdn/shop/files/imalent-bl70-powerful-edc-flashlightimalent-494194_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-bl70-powerful-edc-flashlightimalent-566199_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-bl70-powerful-edc-flashlightimalent-482408_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-bl70-powerful-edc-flashlightimalent-837804_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-bl70-powerful-edc-flashlightimalent-631586_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-bl70-powerful-edc-flashlightimalent-667972_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-bl70-powerful-edc-flashlightimalent-860204_480x480.jpg'),
  ],
  'imalent-ld70': [
    img('//www.imalentstore.com/cdn/shop/files/LD70-black_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/1_66b8b35c-ee80-4dd0-9399-e0976e73c6f7_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/brightest-mini-flashlight-imalent-ld70imalent-629390_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/brightest-mini-flashlight-imalent-ld70imalent-202932_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/3_92962e35-89db-446e-a758-cfa914d8f860-202683_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/brightest-mini-flashlight-imalent-ld70imalent-536975_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/2_7c273085-fe05-481e-85c2-de9e10d57cdb-920464_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/brightest-mini-flashlight-imalent-ld70imalent-169311_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/4_4a252e02-db7e-466a-af10-ce2016dfdf2f-997071_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ld70-4000-lumen-edc-flashlightimalent-854647_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/6_6ae0ebe6-9099-4c3b-8d32-e3956c604e0c_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/7_71b5bd03-e1bd-4420-baa2-f02d4cfa7c0c_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/8_8b2839e5-e233-44a5-ba97-36fbe3ee081b-878176_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/brightest-mini-flashlight-imalent-ld70imalent-237498_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/brightest-mini-flashlight-imalent-ld70imalent-362088_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/brightest-mini-flashlight-imalent-ld70imalent-454045_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/9_a02f0af6-09ff-48c0-a45e-d649503dc699-315878_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/brightest-mini-flashlight-imalent-ld70imalent-867185_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/10_5f59e8cd-7314-454b-93b6-14f115c158b0-966117_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/11_a82fc225-eb2f-4819-84e4-3759d4d39d4e-419116_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/12_eaf2269c-14d5-4489-813e-5b24cdaa889a-787469_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/15_a1a87d14-4f63-4c19-8aad-34419efc4509-784489_480x480.jpg'),
  ],
  'imalent-ms18': [
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms18-brightest-flashlightimalent-604824_480x480.jpg?v=1699952198'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms18-brightest-flashlightimalent-927944_480x480.jpg?v=1699952198'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms18-brightest-flashlightimalent-392405_480x480.jpg?v=1699952198'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms18-brightest-flashlightimalent-844862_480x480.jpg?v=1699952198'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms18-brightest-flashlightimalent-465612_480x480.jpg?v=1699952198'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms18-brightest-flashlightimalent-700547_480x480.jpg?v=1699952198'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms18-brightest-flashlightimalent-907896_480x480.jpg?v=1699952198'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms18-brightest-flashlightimalent-302168_480x480.jpg?v=1699952198'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms18-brightest-flashlightimalent-497011_480x480.jpg?v=1699952198'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms18-brightest-flashlightimalent-745088_480x480.jpg?v=1699952198'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms18-brightest-flashlightimalent-604439_480x480.jpg?v=1699952198'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms18-brightest-flashlightimalent-112974_480x480.jpg?v=1699952198'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms18-brightest-flashlightimalent-932086_480x480.jpg?v=1699952198'),
    img('//www.imalentstore.com/cdn/shop/products/hqdefault_5e40731c-ba70-4fa7-ac6d-0f73e4d3c5a9_480x480.jpg?v=1622614107'),
  ],
  'imalent-ms12': [
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-791699_480x480.jpg?v=1703675345'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-241017_480x480.jpg?v=1703675345'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-556126_480x480.jpg?v=1703675345'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-616352_480x480.jpg?v=1703675345'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-928304_480x480.jpg?v=1703675345'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-519569_480x480.jpg?v=1703675345'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-531158_480x480.jpg?v=1703675345'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-528898_480x480.jpg?v=1703675345'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-770081_480x480.jpg?v=1703675345'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-385749_480x480.jpg?v=1703675345'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-940240_480x480.jpg?v=1703675345'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-427148_480x480.jpg?v=1703675345'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-187292_480x480.jpg?v=1703675346'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-743804_480x480.jpg?v=1703675346'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-913393_480x480.jpg?v=1703675346'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-562643_480x480.jpg?v=1703675346'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-599940_480x480.jpg?v=1703675346'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-593369_480x480.jpg?v=1703675346'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-243522_480x480.jpg?v=1703675346'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-ms12-led-flashlightimalent-296948_480x480.jpg?v=1703675346'),
  ],
  'imalent-sr16': [
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr16-55000-lumen-flashlightimalent-779792_480x480.jpg?v=1664528382'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr16-55000-lumen-flashlightimalent-217353_480x480.jpg?v=1664528382'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr16-55000-lumen-flashlightimalent-587414_480x480.jpg?v=1664528382'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr16-55000-lumen-flashlightimalent-361139_480x480.jpg?v=1664528383'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr16-55000-lumen-flashlightimalent-577233_480x480.jpg?v=1664528383'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr16-55000-lumen-flashlightimalent-337237_480x480.jpg?v=1664528383'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr16-55000-lumen-flashlightimalent-724070_480x480.jpg?v=1664528383'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr16-55000-lumen-flashlightimalent-200727_480x480.jpg?v=1664528383'),
    img('//www.imalentstore.com/cdn/shop/products/SR16-9_480x480.jpg?v=1665373063'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr16-55000-lumen-flashlightimalent-700371_480x480.jpg?v=1665373063'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr16-55000-lumen-flashlightimalent-157627_480x480.jpg?v=1665373063'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr16-55000-lumen-flashlightimalent-791421_480x480.jpg?v=1665373063'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr16-55000-lumen-flashlightimalent-207205_480x480.jpg?v=1665373063'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr16-55000-lumen-flashlightimalent-897878_480x480.jpg?v=1665373063'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr16-55000-lumen-flashlightimalent-898734_480x480.jpg?v=1665373063'),
    img('//www.imalentstore.com/cdn/shop/products/SR16-16_480x480.jpg?v=1665544621'),
    img('//www.imalentstore.com/cdn/shop/products/SR16-17_480x480.jpg?v=1665544621'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-sr16-55000-lumen-flashlightimalent-720591_480x480.jpg?v=1665544621'),
  ],
  'imalent-ld35': [
    img('//www.imalentstore.com/cdn/shop/files/imalent-ld35-rechargeable-edc-flashlightimalent-174328_480x480.jpg?v=1728566681'),
    img('//www.imalentstore.com/cdn/shop/files/imalent_ld35_480x480.jpg?v=1727170627'),
    'https://ucarecdn.com/cda0c144-c97f-4027-9d11-cea8d880c212/-/format/auto/-/preview/3000x3000/-/quality/lighter/LD35-1280x720-1.jpg',
    'https://ucarecdn.com/8dcfef03-3768-43fd-85f0-979a2973deb7/-/format/auto/-/preview/3000x3000/-/quality/lighter/9b85b802ba76f8f793d0dfb8aef3c29d.jpeg',
    'https://ucarecdn.com/d1c88720-c6dd-4f8e-9e1f-de531997d53f/-/format/auto/-/preview/3000x3000/-/quality/lighter/LD35-1280x720-8.jpg',
    'https://ucarecdn.com/f85ad6e3-0acc-4d5d-8a45-fa57fe14530a/-/format/auto/-/preview/3000x3000/-/quality/lighter/LD35-1280x720-3.jpg',
    'https://ucarecdn.com/3f9c26fb-3705-40d5-a2ac-e488a8c577f8/-/format/auto/-/preview/3000x3000/-/quality/lighter/LD35-1280x720-7.jpg',
    'https://ucarecdn.com/9361737d-21f9-4269-bc2a-45ad5e8027fc/-/format/auto/-/preview/3000x3000/-/quality/lighter/LD35-1280x720-9.jpg',
    'https://ucarecdn.com/091634a8-2c74-4762-8e02-55e46215d6ef/-/format/auto/-/preview/3000x3000/-/quality/lighter/LD35-1280x720-5.jpg',
    'https://ucarecdn.com/f691c6cc-2526-4599-83e3-9c42dce0a3b7/-/format/auto/-/preview/3000x3000/-/quality/lighter/LD35-1280x720-10.jpg',
    'https://ucarecdn.com/73fe248d-b8d5-4c56-9e18-209a012d932b/-/format/auto/-/preview/3000x3000/-/quality/lighter/LD35-1280x720-15.jpg',
    'https://ucarecdn.com/9ca4cc41-68a5-4f59-84cf-3fb23e540fbb/-/format/auto/-/preview/3000x3000/-/quality/lighter/LD35-1280x720-18.jpeg',
    'https://ucarecdn.com/1307b711-ac29-4181-ab58-68af8ea83376/-/format/auto/-/preview/3000x3000/-/quality/lighter/LD35-1280x720-17.jpg',
  ],
  'imalent-bl50': [
    img('//www.imalentstore.com/cdn/shop/products/dual-light-sources-edc-flashlight-imalent-bl50imalent-303974_480x480.jpg'),
    ...Array.from({ length: 18 }, (_, i) =>
      `https://www.imalentstore.com/cdn/shop/files/BL50-${String(i + 2).padStart(2, '0')}_1024x1024.jpg`
    ),
    img('//www.imalentstore.com/cdn/shop/products/dual-light-sources-edc-flashlight-imalent-bl50imalent-990222_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/dual-light-sources-edc-flashlight-imalent-bl50imalent-187186_480x480.jpg'),
    img('//www.imalentstore.com/cdn/shop/products/dual-light-sources-edc-flashlight-imalent-bl50imalent-488967_480x480.jpg'),
  ],
  'imalent-mr90': [
    img('//www.imalentstore.com/cdn/shop/products/4_1-289168_480x480.jpg?v=1655863447'),
    img('//www.imalentstore.com/cdn/shop/products/5_1_e6ca3754-4cba-472d-9b33-15431761aa82-661659_480x480.jpg?v=1655863447'),
    img('//www.imalentstore.com/cdn/shop/products/1_bef11d57-0ef0-4479-9509-b16dccc4acd6-274109_480x480.jpg?v=1655863447'),
    img('//www.imalentstore.com/cdn/shop/products/2_b830d9c1-3c0b-4493-9dfc-d8b493c61249-700941_480x480.jpg?v=1655863447'),
    img('//www.imalentstore.com/cdn/shop/products/3_a73f96a1-9dce-429e-b470-8372b75aa2a7-919597_480x480.jpg?v=1655863447'),
    img('//www.imalentstore.com/cdn/shop/products/4_698eebeb-5530-4cbd-a6c8-94f77fed59b4-308148_480x480.jpg?v=1655863447'),
    img('//www.imalentstore.com/cdn/shop/products/5_f160a740-6eb7-4eae-8138-1de434ac1225-303279_480x480.jpg?v=1655863447'),
    img('//www.imalentstore.com/cdn/shop/products/6_1e918840-9bab-4511-ae68-189d7c9d8f76_480x480.jpg?v=1655175046'),
    img('//www.imalentstore.com/cdn/shop/products/imalent-mr90-50000-lumen-flashlightimalent-762056_480x480.jpg?v=1671246922'),
    img('//www.imalentstore.com/cdn/shop/products/9_da7f21ba-9142-44bb-bdfe-fd1b34a561c0-516886_480x480.jpg?v=1671246922'),
    img('//www.imalentstore.com/cdn/shop/products/10_bdb0da97-64f1-4818-ab0d-8de72c187a10-939301_480x480.jpg?v=1671246922'),
    img('//www.imalentstore.com/cdn/shop/products/11_03ee8757-205c-40a7-9518-88eae63d7868-210628_480x480.jpg?v=1671246922'),
    img('//www.imalentstore.com/cdn/shop/products/12_9d95d1ba-c627-4101-8eb2-f8e9ff1cf08a-634574_480x480.jpg?v=1671246922'),
    img('//www.imalentstore.com/cdn/shop/products/13_40f763e0-1262-4f4d-b48d-4d35f20af625-722170_480x480.jpg?v=1671246922'),
    img('//www.imalentstore.com/cdn/shop/products/14_56f9a8c1-f460-4f85-8545-cdef3c6c085b_480x480.jpg?v=1671246922'),
    img('//www.imalentstore.com/cdn/shop/products/15_98b4f8fa-c9af-4456-9e1e-4fb09b11118f-294800_480x480.jpg?v=1671246922'),
    img('//www.imalentstore.com/cdn/shop/products/16_1e50c232-e639-4332-ba8f-b99ab51ab8a4-449753_480x480.jpg?v=1671246922'),
    img('//www.imalentstore.com/cdn/shop/products/17_1ad16784-800e-4ecf-a631-3c9dd81c9cec-625942_480x480.jpg?v=1671246922'),
    img('//www.imalentstore.com/cdn/shop/products/7_1d303fed-b98b-41c4-8bbc-9a4d9c8a2bb2-870916_480x480.jpg?v=1671246922'),
  ],
  'imalent-gr36': [
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr36-new-peak-clip-flashlightimalent-8003506_480x480.jpg?v=1758269537'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr36-new-peak-clip-flashlightimalent-4165273_480x480.jpg?v=1758269537'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr36-new-peak-clip-flashlightimalent-1207840_480x480.jpg?v=1755791453'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr36-new-peak-clip-flashlightimalent-2506217_480x480.jpg?v=1755791453'),
    img('//www.imalentstore.com/cdn/shop/files/imalent-gr36-new-peak-clip-flashlightimalent-3249027_480x480.jpg?v=1755874366'),
  ],
}

// ─── Seed + Upload ────────────────────────────────────────────────────────────

async function seed() {
  const { data: inserted, error } = await supabase
    .from('flashlights')
    .upsert(flashlights, { onConflict: 'slug' })
    .select('id, slug, image_url')

  if (error) { console.error('Upsert error:', error.message); process.exit(1) }
  console.log(`✓ Upserted ${inserted.length} flashlights`)

  const slugToId = Object.fromEntries(inserted.map((r) => [r.slug, r.id]))

  // Upload primary images
  for (const f of inserted) {
    if (isAlreadyBlob(f.image_url)) { console.log(`  [skip primary] ${f.slug}`); continue }
    const srcUrl = flashlights.find((x) => x.slug === f.slug)?.image_url
    if (!srcUrl) continue
    try {
      const ext = getExt(srcUrl)
      const { buf, ct } = await downloadImage(srcUrl)
      const blobUrl = await uploadToBlob(buf, ct, `flashlights/${f.slug}/primary${ext}`)
      await supabase.from('flashlights').update({ image_url: blobUrl }).eq('id', f.id)
      console.log(`  [ok primary]  ${f.slug}`)
    } catch (err) {
      console.error(`  [err primary] ${f.slug}: ${err.message}`)
    }
  }

  // Upload extra images
  for (const [slug, urls] of Object.entries(extraImages)) {
    const flashlightId = slugToId[slug]
    if (!flashlightId) { console.warn(`  [warn] slug not found: ${slug}`); continue }

    await supabase.from('flashlight_images').delete().eq('flashlight_id', flashlightId)

    const rows = []
    for (let i = 0; i < urls.length; i++) {
      const srcUrl = urls[i]
      let finalUrl = srcUrl
      if (!isAlreadyBlob(srcUrl)) {
        try {
          const ext = getExt(srcUrl)
          const { buf, ct } = await downloadImage(srcUrl)
          finalUrl = await uploadToBlob(buf, ct, `flashlights/${slug}/extra-${i}${ext}`)
          console.log(`  [ok extra]    ${slug}/extra-${i}`)
        } catch (err) {
          console.error(`  [err extra]   ${slug}/extra-${i}: ${err.message}`)
        }
      }
      rows.push({ flashlight_id: flashlightId, url: finalUrl, sort_order: i })
    }

    if (rows.length > 0) {
      const { error: imgErr } = await supabase.from('flashlight_images').insert(rows)
      if (imgErr) console.error(`  [err insert] ${slug}: ${imgErr.message}`)
    }
  }

  console.log('\nDone!')
}

seed()
