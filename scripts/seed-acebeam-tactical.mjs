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

const flashlights = [
  {
    brand: 'Acebeam', model: 'T29 Red (12th Anniversary)', slug: 'acebeam-t29-red-12th', category: 'Tactical',
    max_lumens: 2900, min_lumens: 12, beam_distance_m: 1400,
    emitters: ['Luminus SFT-42R'], battery_type: '21700', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 194.8, head_diameter_mm: 66, body_diameter_mm: 25.4, weight_g: null,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 109.90, material: 'Aluminum',
    description: 'Limited 12th anniversary edition of the T29 long-range flashlight in red, delivering 2900 lumens and a 1400-meter beam with USB-C rechargeable 21700 battery.',
    image_url: 'https://www.acebeam.com/images/thumbs/009/0094083_acebeam-t29-red-12th-anniversary-version.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'W20', slug: 'acebeam-w20', category: 'Tactical',
    max_lumens: 600, min_lumens: 30, beam_distance_m: 1100,
    emitters: [], battery_type: 'CR123A', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 115.1, head_diameter_mm: 32, body_diameter_mm: 25.4, weight_g: null,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 189.00, material: 'Aluminum',
    description: 'Compact LEP flashlight delivering a focused 1100-meter beam with wide-angle spill, powered by a USB-C rechargeable 16340 battery.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089876_w20-lep-flashlight-with-wide-angle-spill.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'T29', slug: 'acebeam-t29', category: 'Tactical',
    max_lumens: 2900, min_lumens: 12, beam_distance_m: 1400,
    emitters: ['Luminus SFT-42R'], battery_type: '21700', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 194.8, head_diameter_mm: 66, body_diameter_mm: 25.4, weight_g: null,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 109.90, material: 'Aluminum',
    description: 'Ultra long-range hunting flashlight delivering 2900 lumens with a massive 1400-meter beam, ideal for hunting and search operations.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089853_t29-ultra-long-range-hunting-flashlight_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'P16 2.0', slug: 'acebeam-p16-20', category: 'Tactical',
    max_lumens: 3000, min_lumens: 60, beam_distance_m: 543,
    emitters: ['Luminus SFT-42R'], battery_type: '18650', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 136.3, head_diameter_mm: 32, body_diameter_mm: 25, weight_g: null,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 99.90, material: 'Aluminum',
    description: 'Dual-tail-switch tactical flashlight delivering 3000 lumens with three independent modes, hidden USB-C port, and 18650 power for law enforcement and military use.',
    image_url: 'https://www.acebeam.com/images/thumbs/009/0094110_p16-20-dual-tail-switch-tactical-flashlight-with-three-modes_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'W10 Pro', slug: 'acebeam-w10-pro', category: 'Tactical',
    max_lumens: 750, min_lumens: 300, beam_distance_m: 1425,
    emitters: [], battery_type: '21700', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 152.9, head_diameter_mm: 34, body_diameter_mm: 25.4, weight_g: null,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 229.00, material: 'Aluminum',
    description: 'LEP flashlight with a 1425-meter pencil-thin beam, hidden USB-C port, and military-grade hard-anodized finish.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089450_w10-pro-lep-flashlight_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'T37', slug: 'acebeam-t37', category: 'Tactical',
    max_lumens: 4000, min_lumens: 30, beam_distance_m: 440,
    emitters: ['Luminus SFT-90X'], battery_type: '21700', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 145.2, head_diameter_mm: 30, body_diameter_mm: null, weight_g: null,
    ip_rating: 'IP68', impact_resistance_m: null, price_usd: 129.90, material: 'Aluminum',
    description: 'Tactical and duty flashlight delivering 4000 lumens from a single SFT-90X LED with USB-C charging and a compact 21700 body.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089708_t37-tactical-and-duty-flashlight.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'X20-R', slug: 'acebeam-x20-r', category: 'Tactical',
    max_lumens: 10000, min_lumens: 80, beam_distance_m: 645,
    emitters: ['LUXEON HL4X', 'CREE XP-LR', 'Luminus SFT-25R'], battery_type: '18650', battery_count: 2,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 136.3, head_diameter_mm: 45.5, body_diameter_mm: 22.6, weight_g: null,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 149.90, material: 'Aluminum',
    description: 'High-output tactical flashlight with 8 LEDs delivering up to 10,000 lumens across three LED options, powered by dual 18650 batteries with USB-C charging.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089343_x20-r-high-output-tactical-flashlight-with-three-modes_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'G10', slug: 'acebeam-g10', category: 'Weapon Light',
    max_lumens: 600, min_lumens: 250, beam_distance_m: 200,
    emitters: ['Luminus SFT-25R'], battery_type: 'CR123A', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 68.3, head_diameter_mm: null, body_diameter_mm: 31.4, weight_g: null,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 89.90, material: 'Aluminum',
    description: 'Compact rail-mounted weapon light delivering 600 lumens with a 200-meter beam, featuring USB-C charging and IP68 waterproofing for tactical firearms use.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089796_g10-rail-mounted-light.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'L16 2.0', slug: 'acebeam-l16-20', category: 'Tactical',
    max_lumens: 3000, min_lumens: 8, beam_distance_m: 713,
    emitters: ['Luminus SFT-42R'], battery_type: '21700', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 153.2, head_diameter_mm: 40.5, body_diameter_mm: 25.4, weight_g: null,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 109.90, material: 'Aluminum',
    description: 'Long-range tactical flashlight delivering 3000 lumens and a 713-meter beam using the Luminus SFT-42R LED, with USB-C charging and IP68 waterproofing.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089864_l16-20-tactical-flashlight-with-sft-42r-led_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'T35', slug: 'acebeam-t35', category: 'Tactical',
    max_lumens: 1900, min_lumens: 3, beam_distance_m: 380,
    emitters: ['Luminus SFT-40'], battery_type: '18650', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 137.6, head_diameter_mm: null, body_diameter_mm: 26.9, weight_g: null,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 64.90, material: 'Aluminum',
    description: 'Compact tactical flashlight delivering 1900 lumens from a single SFT-40 LED, compatible with 18650 or 2×CR123A batteries and featuring USB-C charging.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089415_t35-compact-tactical-flashlight.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'L35 2.0', slug: 'acebeam-l35-20', category: 'Tactical',
    max_lumens: 5000, min_lumens: 1, beam_distance_m: 650,
    emitters: ['CREE XHP70.3 HI'], battery_type: '21700', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 152, head_diameter_mm: 54.2, body_diameter_mm: 25.4, weight_g: null,
    ip_rating: 'IP68', impact_resistance_m: 1.0, price_usd: 114.90, material: 'Aluminum',
    description: 'Brightest duty flashlight delivering 5000 lumens from a single CREE XHP70.3 HI LED with a 650-meter beam, powered by 21700 with USB-C charging.',
    image_url: 'https://www.acebeam.com/images/thumbs/009/0090949_l35-20-brightest-duty-flashlight.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'W35 LC', slug: 'acebeam-w35-lc', category: 'Tactical',
    max_lumens: 800, min_lumens: 60, beam_distance_m: 2600,
    emitters: [], battery_type: '21700', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 189.9, head_diameter_mm: 60, body_diameter_mm: 30, weight_g: null,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 339.90, material: 'Aluminum',
    description: "World's first LC DEL zoom LEP flashlight with electronic beam adjustment reaching 2600 meters, featuring liquid crystal diffractive electro-optic lens technology.",
    image_url: 'https://www.acebeam.com/images/thumbs/008/0084797_w35-lc-del-zoom-lep-flashlight_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'Defender P17 (Dark Green)', slug: 'acebeam-p17-green', category: 'Tactical',
    max_lumens: 4900, min_lumens: 3, beam_distance_m: 445,
    emitters: ['CREE XHP70.3 HI'], battery_type: '21700', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 147, head_diameter_mm: 41, body_diameter_mm: 26, weight_g: 154,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 119.99, material: 'Aluminum',
    description: 'Dark green tactical flashlight delivering 4900 lumens with a 445-meter beam, featuring dual-switch interface and USB-C rechargeable 21700 battery.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0087126_defender-p17-dark-green_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'Defender P17', slug: 'acebeam-p17', category: 'Tactical',
    max_lumens: 4900, min_lumens: 3, beam_distance_m: 445,
    emitters: ['CREE XHP70.3 HI'], battery_type: '21700', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 147, head_diameter_mm: 41, body_diameter_mm: 26, weight_g: 154,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 119.90, material: 'Aluminum',
    description: 'Tactical duty flashlight delivering 4900 lumens from a CREE XHP70.3 HI LED with dual-switch operation and USB-C rechargeable 21700 battery.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089437_defender-p17_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'P18', slug: 'acebeam-p18', category: 'Tactical',
    max_lumens: 5000, min_lumens: null, beam_distance_m: 629,
    emitters: ['Luminus SFT-40'], battery_type: '21700', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 144.9, head_diameter_mm: null, body_diameter_mm: 50.8, weight_g: 185,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 129.90, material: 'Aluminum',
    description: 'Quad-core tactical flashlight with 4×SFT-40 LEDs delivering 5000 lumens and a 629-meter beam, featuring a concealed USB-C port and 21700 power.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0087129_p18-quad-core-tactical-flashlight_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'Defender P16', slug: 'acebeam-defender-p16', category: 'Tactical',
    max_lumens: 1800, min_lumens: 50, beam_distance_m: 484,
    emitters: ['Luminus SFT-40'], battery_type: '18650', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 131.2, head_diameter_mm: 32, body_diameter_mm: 23.2, weight_g: 108.7,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 84.90, material: 'Aluminum',
    description: 'Compact tactical flashlight delivering 1800 lumens with a 484-meter throw, USB-C charging, and compatibility with 18650 or 2×CR123A batteries.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089798_defender-p16_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'L19 2.0', slug: 'acebeam-l19-20', category: 'Tactical',
    max_lumens: 2200, min_lumens: 1, beam_distance_m: 1083,
    emitters: ['Luminus SFT-40', 'Osram KW CULPM1'], battery_type: '21700', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 163.8, head_diameter_mm: 60, body_diameter_mm: 25.4, weight_g: 205,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 119.90, material: 'Aluminum',
    description: 'Long-range flashlight delivering up to 2200 lumens with 1083-meter throw (white) or 1520-meter throw (green LED variant), powered by 21700 with USB-C charging.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089801_l19-20-long-range-flashlight_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'Defender P16 (Gray)', slug: 'acebeam-defender-p16-gray', category: 'Tactical',
    max_lumens: 1800, min_lumens: 50, beam_distance_m: 484,
    emitters: ['Luminus SFT-40'], battery_type: '18650', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 131.2, head_diameter_mm: 32, body_diameter_mm: 23.2, weight_g: 108.7,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 84.90, material: 'Aluminum',
    description: 'Gray tactical flashlight delivering 1800 lumens with a 484-meter throw, USB-C charging, and compatibility with 18650 or 2×CR123A batteries.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0087131_defender-p16-gray_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'L18', slug: 'acebeam-l18', category: 'Tactical',
    max_lumens: 1500, min_lumens: 1, beam_distance_m: 1000,
    emitters: ['Osram KW CSLPM1'], battery_type: '21700', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 154, head_diameter_mm: 52.2, body_diameter_mm: 25.4, weight_g: null,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 89.95, material: 'Aluminum',
    description: 'Long-range tactical flashlight delivering 1500 lumens (white) or 2100 lumens (green) with up to 1155-meter beam, powered by 21700 with USB-C charging.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0083609_l18-tactical-flashlight_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'L17', slug: 'acebeam-l17', category: 'Tactical',
    max_lumens: 1400, min_lumens: null, beam_distance_m: 802,
    emitters: ['Osram KW CULPM1'], battery_type: '18650', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 140.5, head_diameter_mm: 40, body_diameter_mm: 25.4, weight_g: 150,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 74.90, material: 'Aluminum',
    description: 'Tactical flashlight delivering 1400 lumens with an 802-meter beam in white, green, or red LED options, powered by 18650 with USB-C charging.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0083610_l17-tactical-flashlight_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'Defender P17 (Gray)', slug: 'acebeam-defender-p17-gray', category: 'Tactical',
    max_lumens: 4900, min_lumens: 3, beam_distance_m: 445,
    emitters: ['CREE XHP70.3 HI'], battery_type: '21700', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 147, head_diameter_mm: 41, body_diameter_mm: 26, weight_g: 154,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 119.99, material: 'Aluminum',
    description: 'Gray tactical duty flashlight delivering 4900 lumens from a CREE XHP70.3 HI LED with dual-switch operation and USB-C rechargeable 21700 battery.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0087132_defender-p17-gray_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'Defender P17 (Sand)', slug: 'acebeam-p17-sand', category: 'Tactical',
    max_lumens: 4900, min_lumens: 3, beam_distance_m: 445,
    emitters: ['CREE XHP70.3 HI'], battery_type: '21700', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 147, head_diameter_mm: 41, body_diameter_mm: 26, weight_g: 154,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 119.99, material: 'Aluminum',
    description: 'Sand-colored tactical duty flashlight delivering 4900 lumens from a CREE XHP70.3 HI LED with dual-switch operation and USB-C rechargeable 21700 battery.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0087133_defender-p17-sand_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'L19 1.0', slug: 'acebeam-l19-10', category: 'Tactical',
    max_lumens: 2200, min_lumens: null, beam_distance_m: 1082,
    emitters: ['Luminus SFT-40'], battery_type: '21700', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 163.8, head_diameter_mm: null, body_diameter_mm: 60, weight_g: 196,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 119.90, material: 'Aluminum',
    description: 'Long-range hunting flashlight delivering 2200 lumens with a 1082-meter beam, available in white, green, and IR 850nm LED options with USB-C charging.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0083761_l19-10-long-range-hunting-flashlight_600.jpeg',
    is_discontinued: false,
  },
]

async function download(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://www.acebeam.com/',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const ct = res.headers.get('content-type') ?? 'image/jpeg'
  const buf = await res.arrayBuffer()
  return { buf, ct }
}

async function run() {
  // 1. Upsert flashlight data (with external image_url)
  console.log(`Upserting ${flashlights.length} Acebeam tactical flashlights...`)
  const { data, error } = await supabase
    .from('flashlights')
    .upsert(flashlights, { onConflict: 'slug' })
    .select('id, slug, image_url')

  if (error) { console.error(error.message); process.exit(1) }
  console.log(`✓ ${data.length} rows upserted\n`)

  // 2. Migrate images to Vercel Blob
  console.log('Migrating images to Vercel Blob...')
  let ok = 0, skip = 0, err = 0

  for (const row of data) {
    if (!row.image_url) { console.log(`  [skip] ${row.slug} — no image`); skip++; continue }
    if (row.image_url.includes('vercel-storage.com') || row.image_url.includes('blob.vercel')) {
      console.log(`  [skip] ${row.slug}`); skip++; continue
    }
    try {
      const ext = row.image_url.endsWith('.png') ? '.png' : '.jpeg'
      const { buf, ct } = await download(row.image_url)
      const { url: blobUrl } = await put(`flashlights/${row.slug}/primary${ext}`, buf, {
        access: 'public', token: BLOB_TOKEN, contentType: ct,
      })
      await supabase.from('flashlights').update({ image_url: blobUrl }).eq('id', row.id)
      console.log(`  [ok]   ${row.slug}`)
      ok++
    } catch (e) {
      console.error(`  [err]  ${row.slug}: ${e.message}`)
      err++
    }
  }

  console.log(`\nDone — ${ok} images migrated, ${skip} skipped, ${err} errors`)
}

run().catch(console.error)
