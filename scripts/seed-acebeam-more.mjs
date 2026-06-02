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
  // === Headlamps ===
  {
    brand: 'Acebeam', model: 'H17 2.0', slug: 'acebeam-h17-20', category: 'Headlamp',
    max_lumens: 2000, min_lumens: 1, beam_distance_m: 128,
    emitters: ['TN'], battery_type: '18350', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 79, head_diameter_mm: 24.3, body_diameter_mm: 23, weight_g: 73,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 59.90, material: 'Aluminum',
    description: 'Multi-light-source headlamp delivering 2000 lumens from 3 TN 4000K LEDs plus RGB auxiliary lights, powered by a USB-C rechargeable 18350 battery.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089245_h17-20-multi-light-source-headlamp_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'H35', slug: 'acebeam-h35', category: 'Headlamp',
    max_lumens: 2600, min_lumens: 10, beam_distance_m: 170,
    emitters: ['LUXEON HL4X'], battery_type: '18650', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 87, head_diameter_mm: 46, body_diameter_mm: 40, weight_g: 163,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 99.90, material: 'Aluminum',
    description: '5-core dual-light-source industrial headlamp with 4× LUXEON HL4X LEDs plus a red CREE LED, delivering 2600 lumens with USB-C charging.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0087134_h35-5-core-dual-light-source-industrial-headlamp.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'H16 (Orange)', slug: 'acebeam-h16-headlamp', category: 'Headlamp',
    max_lumens: 650, min_lumens: 5, beam_distance_m: 86,
    emitters: ['Nichia 519A'], battery_type: '14500', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 81.6, head_diameter_mm: null, body_diameter_mm: 19, weight_g: 53.5,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 44.90, material: 'Aluminum',
    description: 'Lightweight outdoor headlamp with high-CRI Nichia 519A-V1 5000K LED delivering 650 lumens, powered by 14500 or AA batteries with USB-C charging.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0087135_h16-headlamp-orange-519a-v1-led.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'H15 2.0', slug: 'acebeam-h15-20', category: 'Headlamp',
    max_lumens: 2800, min_lumens: 1, beam_distance_m: 220,
    emitters: [], battery_type: '18650', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 111.1, head_diameter_mm: null, body_diameter_mm: 25, weight_g: 157.6,
    ip_rating: 'IP68', impact_resistance_m: 6.5, price_usd: 99.90, material: 'Aluminum',
    description: 'Rechargeable industrial headlamp delivering 2800 lumens with a primary white LED and auxiliary red LED, rated for a 6.5-meter impact resistance.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0087136_h15-20-rechargeable-industrial-headlamp_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'H16', slug: 'acebeam-h16', category: 'Headlamp',
    max_lumens: 1000, min_lumens: 5, beam_distance_m: 105,
    emitters: ['Nichia 519A'], battery_type: '14500', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 81.6, head_diameter_mm: null, body_diameter_mm: 19, weight_g: 53.5,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 44.90, material: 'Aluminum',
    description: 'Lightweight outdoor headlamp delivering up to 1000 lumens (Gray model), powered by a rechargeable 14500 or standard AA battery with USB-C charging.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089646_h16-lightweight-outdoor-headlamp.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'H50 2.0', slug: 'acebeam-h50-20', category: 'Headlamp',
    max_lumens: 2000, min_lumens: 3, beam_distance_m: 141,
    emitters: ['Luminus SST-20'], battery_type: '18650', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 85, head_diameter_mm: null, body_diameter_mm: 33.5, weight_g: 142.3,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 89.90, material: 'Aluminum',
    description: 'Rechargeable wide-beam headlamp with 3× Luminus SST-20 neutral white LEDs delivering 2000 lumens, compatible with 18650 or 2× CR123A batteries.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0087140_h50-20-rechargeable-headlamp_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'H30', slug: 'acebeam-h30', category: 'Headlamp',
    max_lumens: 4000, min_lumens: 3, beam_distance_m: 171,
    emitters: ['CREE XHP70.2'], battery_type: '21700', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 89.4, head_diameter_mm: 40.8, body_diameter_mm: 29, weight_g: 190,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 137.90, material: 'Aluminum',
    description: 'Brightest USB-C rechargeable headlamp delivering 4000 lumens from a CREE XHP70.2 LED, with selectable auxiliary red-green / red-CRI / red-UV options.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089330_h30-usb-c-rechargeable-brightest-headlamp_600.jpeg',
    is_discontinued: false,
  },

  // === High-power / Search ===
  {
    brand: 'Acebeam', model: 'X30', slug: 'acebeam-x30', category: 'Search & Rescue',
    max_lumens: 20000, min_lumens: 40, beam_distance_m: 600,
    emitters: ['CREE XHP70.2'], battery_type: '21700', battery_count: 2,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 159.7, head_diameter_mm: 52.5, body_diameter_mm: 46.8, weight_g: 473.7,
    ip_rating: 'IP68', impact_resistance_m: 1.0, price_usd: 209.00, material: 'Aluminum',
    description: 'Dual-source searching flashlight delivering 20,000 lumens from 3 CREE XHP70 LEDs with three modes, powered by dual 21700 batteries with hidden USB-C charging.',
    image_url: 'https://www.acebeam.com/images/thumbs/009/0091009_x30-dual-source-searching-flashlight-with-three-modes.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'X25', slug: 'acebeam-x25', category: 'Search & Rescue',
    max_lumens: 23000, min_lumens: 700, beam_distance_m: 1553,
    emitters: ['CREE XP-LR', 'Luminus SFT-25R'], battery_type: '21700', battery_count: 4,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 157.5, head_diameter_mm: 92, body_diameter_mm: null, weight_g: 1073,
    ip_rating: 'IP68', impact_resistance_m: null, price_usd: 389.90, material: 'Aluminum',
    description: 'High-power long-range flashlight with 16 LEDs delivering up to 23,000 lumens and a 1,553-meter beam, powered by a built-in pack or 4× 21700 cells.',
    image_url: 'https://www.acebeam.com/images/thumbs/009/0090913_x25-high-power-long-range-flashlight_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'P20', slug: 'acebeam-p20', category: 'Thrower',
    max_lumens: 5600, min_lumens: 50, beam_distance_m: 1454,
    emitters: ['Luminus SFT-90X'], battery_type: '21700', battery_count: 2,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 267.5, head_diameter_mm: 79, body_diameter_mm: 25.4, weight_g: 504,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 199.00, material: 'Aluminum',
    description: 'Professional long-distance flashlight delivering 5600 lumens and a 1,454-meter beam from a single Luminus SFT-90X LED, powered by dual 21700 cells.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089290_p20-professional-long-distance-flashlight.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'K75 2.0', slug: 'acebeam-k75-20', category: 'Thrower',
    max_lumens: 6500, min_lumens: 7, beam_distance_m: 2716,
    emitters: ['Luminus SFT-90X'], battery_type: '18650', battery_count: 4,
    charging_type: 'none', has_usb_charging: false,
    length_mm: 213.6, head_diameter_mm: 126, body_diameter_mm: 53, weight_g: 932.9,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 349.90, material: 'Aluminum',
    description: 'Longest-throw flashlight delivering 6500 lumens and an extreme 2,716-meter beam from a single Luminus SFT-90X LED, powered by 4× 18650 batteries.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089799_k75-20-longest-throw-flashlight_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'X75', slug: 'acebeam-x75', category: 'Search & Rescue',
    max_lumens: 80000, min_lumens: 900, beam_distance_m: 1150,
    emitters: ['CREE XHP70.2'], battery_type: '21700', battery_count: 4,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 176, head_diameter_mm: 92, body_diameter_mm: 60, weight_g: 1240,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 419.90, material: 'Aluminum',
    description: 'Ultra-bright searchlight with 12 CREE XHP70 LEDs delivering an enormous 80,000 lumens, powered by 4× 21700 cells with up to PD100W USB-C fast charging.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0087142_x75-ultra-bright-flashlight_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'X75 (MAO Special Edition)', slug: 'acebeam-x75-mao', category: 'Search & Rescue',
    max_lumens: 67000, min_lumens: 900, beam_distance_m: 1306,
    emitters: ['CREE XHP70.3 HI'], battery_type: '21700', battery_count: 4,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 176, head_diameter_mm: 92, body_diameter_mm: 60, weight_g: null,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 449.90, material: 'Aluminum',
    description: 'Micro-arc-oxidation special-edition power-bank searchlight with 12 CREE XHP70.3 HI LEDs delivering 67,000 lumens and a 1,306-meter beam.',
    image_url: 'https://www.acebeam.com/images/thumbs/009/0090925_x75-high-power-bank-flashlight-with-special-edition_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'X50 2.0', slug: 'acebeam-x50-20', category: 'Search & Rescue',
    max_lumens: 45000, min_lumens: null, beam_distance_m: 977,
    emitters: ['CREE XHP70.3 HI'], battery_type: '21700', battery_count: 3,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 139.6, head_diameter_mm: null, body_diameter_mm: 75, weight_g: 756,
    ip_rating: 'IP68', impact_resistance_m: 1.0, price_usd: 379.00, material: 'Aluminum',
    description: "Power-bank searchlight with 8 CREE LEDs delivering 45,000 lumens, the first with PD60W output, powered by 3× 21700 cells with QC 3.0 / USB-C charging.",
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089725_x50-20-first-pd-power-bank-flashlight.jpeg',
    is_discontinued: false,
  },

  // === LEP / white laser (Thrower) ===
  {
    brand: 'Acebeam', model: 'W50 2.0', slug: 'acebeam-w50-20', category: 'Thrower',
    max_lumens: 2200, min_lumens: 230, beam_distance_m: 5062,
    emitters: ['LEP'], battery_type: '18650', battery_count: 8,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 216.4, head_diameter_mm: 84, body_diameter_mm: 79, weight_g: 1660.9,
    ip_rating: 'IP68', impact_resistance_m: null, price_usd: 2999.00, material: 'Aluminum',
    description: 'Zoomable LEP flashlight with an extreme 5,062-meter beam, delivering 2200 lumens of laser-excited phosphor light, powered by 8× 18650 batteries.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089808_w50-20-zoomable-lep-flashlight.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'W30', slug: 'acebeam-w30', category: 'Thrower',
    max_lumens: 500, min_lumens: null, beam_distance_m: 2408,
    emitters: ['LEP'], battery_type: '21700', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 199.1, head_diameter_mm: 61, body_diameter_mm: 30, weight_g: 248,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 399.90, material: 'Aluminum',
    description: 'LEP flashlight with a 2,408-meter laser beam delivering 500 lumens, powered by a 21700 (or 18650) battery.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089554_w30-lep-flashlight_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'W50', slug: 'acebeam-w50', category: 'Thrower',
    max_lumens: 2900, min_lumens: null, beam_distance_m: 3985,
    emitters: ['LEP'], battery_type: '18650', battery_count: 8,
    charging_type: 'none', has_usb_charging: false,
    length_mm: 216.3, head_diameter_mm: 80, body_diameter_mm: 80, weight_g: 1898.5,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 2999.00, material: 'Aluminum',
    description: 'High-power LEP white laser flashlight with a 3,985-meter beam delivering 2900 lumens, powered by 8× 18650 batteries.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0083742_lep-lights-w50_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'W10 Gen II', slug: 'acebeam-w10-gen-2', category: 'Thrower',
    max_lumens: 450, min_lumens: null, beam_distance_m: 1217,
    emitters: ['LEP'], battery_type: '21700', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 149.5, head_diameter_mm: 31.5, body_diameter_mm: 25.4, weight_g: 128,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 297.90, material: 'Aluminum',
    description: 'Second-generation LEP flashlight with a 1,217-meter white laser beam delivering 450 lumens, powered by a USB-C rechargeable 21700 battery.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0083746_w10-gen-ii-lep-flashlight_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'W10', slug: 'acebeam-w10', category: 'Thrower',
    max_lumens: 250, min_lumens: null, beam_distance_m: 1000,
    emitters: ['LEP'], battery_type: '21700', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 149.5, head_diameter_mm: 31.5, body_diameter_mm: 25.4, weight_g: 128,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 286.40, material: 'Aluminum',
    description: 'White laser (LEP) flashlight with a 1,000-meter beam delivering 250 lumens, powered by a 21700 battery (or 2× CR123A) with USB-C charging.',
    image_url: 'https://www.acebeam.com/images/thumbs/005/0054762_w10-white-laser-flashlight_600.jpeg',
    is_discontinued: false,
  },

  // === Rail-mounted (Weapon Light) ===
  {
    brand: 'Acebeam', model: 'G15', slug: 'acebeam-g15', category: 'Weapon Light',
    max_lumens: 1800, min_lumens: 650, beam_distance_m: 390,
    emitters: ['Luminus SFT-40'], battery_type: '18650', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 122.2, head_diameter_mm: 25.4, body_diameter_mm: 22, weight_g: 117,
    ip_rating: 'IP68', impact_resistance_m: 1.5, price_usd: 109.90, material: 'Aluminum',
    description: 'Rail-mounted weapon light delivering 1800 lumens with a 390-meter beam from a Luminus SFT-40 LED, powered by 18650 or 2× CR123A with USB-C charging.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0087145_g15-rail-mounted-light_600.jpeg',
    is_discontinued: false,
  },

  // === Diving ===
  {
    brand: 'Acebeam', model: 'D30', slug: 'acebeam-d30', category: 'Diving',
    max_lumens: 5600, min_lumens: 1100, beam_distance_m: 1454,
    emitters: ['Luminus SFT-90X'], battery_type: '21700', battery_count: 2,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 267.9, head_diameter_mm: 71, body_diameter_mm: 25.4, weight_g: 517,
    ip_rating: null, impact_resistance_m: 1.5, price_usd: 189.00, material: 'Aluminum',
    description: 'Diving flashlight rated to 100 meters depth, delivering 5600 lumens and a 1,454-meter beam from a Luminus SFT-90X LED, powered by dual 21700 cells.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089513_d30-diving-flashlight_600.jpeg',
    is_discontinued: false,
  },
  {
    brand: 'Acebeam', model: 'D20 2.0', slug: 'acebeam-d20-20', category: 'Diving',
    max_lumens: 2200, min_lumens: 530, beam_distance_m: 500,
    emitters: ['Luminus SFT-40'], battery_type: '21700', battery_count: 1,
    charging_type: 'usb', has_usb_charging: true,
    length_mm: 136, head_diameter_mm: 34, body_diameter_mm: 27, weight_g: 128,
    ip_rating: null, impact_resistance_m: 1.5, price_usd: 129.90, material: 'Aluminum',
    description: 'Dive flashlight rated to 200 meters depth, delivering 2200 lumens from a Luminus SFT-40 LED, powered by a USB-C rechargeable 21700 battery.',
    image_url: 'https://www.acebeam.com/images/thumbs/008/0089794_d20-20-dive-flashlight.jpeg',
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
  console.log(`Upserting ${flashlights.length} Acebeam flashlights (headlamps / high-power / LEP / rail / diving)...`)
  const { data, error } = await supabase
    .from('flashlights')
    .upsert(flashlights, { onConflict: 'slug' })
    .select('id, slug, image_url')

  if (error) { console.error(error.message); process.exit(1) }
  console.log(`✓ ${data.length} rows upserted\n`)

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
