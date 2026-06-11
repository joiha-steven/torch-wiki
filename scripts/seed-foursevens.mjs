import { createClient } from '@supabase/supabase-js'
import { put } from '@vercel/blob'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN

function getExt(url) {
  try { const ext = new URL(url).pathname.split('.').pop(); return ext && ext.length <= 5 ? `.${ext.toLowerCase()}` : '.jpg' }
  catch { return '.jpg' }
}
async function download(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', 'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return { buf: Buffer.from(await res.arrayBuffer()), ct: res.headers.get('content-type') ?? 'image/jpeg' }
}
async function hostImages(slug, urls) {
  const out = []
  for (let i = 0; i < urls.length; i++) {
    const { buf, ct } = await download(urls[i])
    const name = i === 0 ? `primary${getExt(urls[i])}` : `${i}${getExt(urls[i])}`
    const { url } = await put(`flashlights/${slug}/${name}`, buf, { access: 'public', token: BLOB_TOKEN, contentType: ct, addRandomSuffix: true })
    out.push(url); console.log(`    · ${name} → blob`)
  }
  return out
}

const CDN = 'https://cdn.shopify.com/s/files/1/1356/1883'
const IMAGES = {
  'foursevens-maelstrom-mxs': [
    `${CDN}/files/MXS-JAVA-FRONT.jpg`, `${CDN}/files/MXS-JAVA-.75.jpg`, `${CDN}/files/MXS-JAVA-.75-TAIL.jpg`, `${CDN}/files/MXS-JAVA-HAND.jpg`,
  ],
  'foursevens-quark-qk16l-mkiii': [
    `${CDN}/files/Quark-Java-SIDE_0d262bd5-4a2b-44b5-be60-ade46126e44f.jpg`, `${CDN}/files/Quark-Java-FRONT_f4efdb38-a2c0-433f-828d-ba6f4b22dfa8.jpg`, `${CDN}/files/Quark-Java-BACK_aba2cafd-6e3f-41cc-bddd-e5b1c5ff2f1a.jpg`,
  ],
  'foursevens-quark-qk2a-mkiii': [
    `${CDN}/products/QK2A-SB-main.jpg`, `${CDN}/products/IMG_E3788.jpg`, `${CDN}/products/IMG_E3796_ff04103e-1fb7-4c9d-bbeb-42d733c8fffc.jpg`,
  ],
  'foursevens-mini-mkiii': [
    `${CDN}/products/NEW-MINI-2UP.jpg`, `${CDN}/products/mini-Ti.jpg`, `${CDN}/products/mini-Midnight.jpg`,
  ],
  'foursevens-mini-turbo-mkiii': [
    `${CDN}/products/NEW-TURBO-2UP.jpg`, `${CDN}/products/turbo-TT.jpg`, `${CDN}/products/turbo-Midnight.jpg`,
  ],
  'foursevens-preon-p2-5-mkiii': [
    `${CDN}/files/Preon-P2.5-FULL-2_08abc50a-c491-407b-a7c5-cfc39f2cac68.jpg`, `${CDN}/files/Preon-P2.5-storm-grey-2up.jpg`,
  ],
  'foursevens-preon-p1-onibi': [
    `${CDN}/files/CP-front.75.jpg`, `${CDN}/files/EU4A5419.jpg`, `${CDN}/files/EU4A5385.jpg`,
  ],
}

const brand = {
  name: 'Foursevens',
  country: 'USA',
  made_in: null,
  founded_year: 2009,
  website: 'https://prometheuslights.com',
  about: "Foursevens was founded in 2009 by David Chow. Its Quark series was among the first high-performance mass-produced LED flashlights, winning a following for practical design, flexible battery options and premium optics. David Chow announced the brand's closure in late 2017, and in early 2018 Foursevens was acquired by Prometheus Lights (led by designer Jason Hui). Today Foursevens runs as a core product line under Prometheus Lights (DarkSucks) — keeping its original spirit while upgrading to high-CRI LEDs, premium drivers and refined materials (copper, titanium and mil-spec aluminum).",
}

const base = { brand: 'Foursevens', category: 'EDC', charging_type: 'none', has_usb_charging: false, ip_rating: 'IPX8', material: 'Aluminum', impact_resistance_m: null, is_discontinued: false, head_diameter_mm: null }

const flashlights = [
  {
    ...base, model: 'Maelstrom MXS', slug: 'foursevens-maelstrom-mxs',
    max_lumens: 1700, min_lumens: 10, beam_distance_m: 280,
    emitters: ['Nichia 144A'], battery_type: '26650', battery_count: 1, battery_types: ['26650'], battery_options: [{ type: '26650', count: 1 }],
    length_mm: 142, head_diameter_mm: 45.7, body_diameter_mm: null, weight_g: 323, ip_rating: 'IPX6', price_usd: 157,
    description: "A high-output single-26650 light with a wireless inductive charging base (no charging ports on the light) and a Standby mode that auto-activates during power outages. Nichia 144A (4000K, 90+ CRI), 1700 lm, 280 m throw.\n\nA flood version — the **Maelstrom MX3F** — is also offered for wide, close-range light. Available in Java and Safety Red; roughly $157–$185.\n\nType-III hard-anodized 6061-T6 aluminum, IPX6.",
  },
  {
    ...base, model: 'Quark QK16L MKIII', slug: 'foursevens-quark-qk16l-mkiii',
    max_lumens: 650, min_lumens: 0.8, beam_distance_m: 170,
    emitters: ['Nichia 319A'], battery_type: '16650', battery_count: 1, battery_types: ['16650'], battery_options: [{ type: '16650', count: 1 }],
    length_mm: 114, body_diameter_mm: 22.4, weight_g: 91, price_usd: 100,
    description: "A high-CRI EDC running a single 16650 cell. Nichia 319A (4000K, 90+ CRI), 650 lm max down to 0.8 lm, 170 m throw, up to 160 h runtime. Type-III hard-anodized 6061-T6 aluminum, IPX8.\n\nOffered in Slate Blue and Java, plus a Foursevens × Glow Rhino tritium edition. ~$100.",
  },
  {
    ...base, model: 'Quark QK2A MKIII', slug: 'foursevens-quark-qk2a-mkiii',
    max_lumens: 500, min_lumens: 1.5, beam_distance_m: 145,
    emitters: ['Nichia 319A'], battery_type: 'AA', battery_count: 2, battery_types: ['AA'], battery_options: [{ type: 'AA', count: 2 }],
    length_mm: 147, body_diameter_mm: 22.4, weight_g: 119, price_usd: 75,
    description: "A 2×AA EDC for those who prefer common rechargeable NiMH cells. Nichia 319A (4000K, 90+ CRI), 500 lm max / 1.5 lm min, 145 m throw, up to 210 h runtime. Type-III hard-anodized 6061-T6 aluminum, IPX8. Slate Blue. ~$75.",
  },
  {
    ...base, model: 'Mini MKIII', slug: 'foursevens-mini-mkiii',
    max_lumens: 800, min_lumens: 1.5, beam_distance_m: 120,
    emitters: ['Nichia 319A'], battery_type: '16340', battery_count: 1, battery_types: ['16340'], battery_options: [{ type: '16340', count: 1 }],
    length_mm: 56, body_diameter_mm: 20.3, weight_g: 45, price_usd: 80,
    description: "A tiny single-RCR123 (16340) EDC punching 800 lm from a Nichia 319A (4000K, 90+ CRI), down to a 1.5 lm moonlight, 120 m throw. IPX8.\n\nAvailable in Midnight Blue (Type-III hard-anodized 6061-T6 aluminum) or Titanium (6Al/4V). ~$80–$102.",
  },
  {
    ...base, model: 'Mini Turbo MKIII', slug: 'foursevens-mini-turbo-mkiii',
    max_lumens: 700, min_lumens: 1.5, beam_distance_m: 200,
    emitters: ['Cree XP-L HI'], battery_type: '16340', battery_count: 1, battery_types: ['16340'], battery_options: [{ type: '16340', count: 1 }],
    length_mm: 61, body_diameter_mm: 20.3, weight_g: 51, price_usd: 85,
    description: "The throw-focused Mini: a deeper reflector and a Cree XP-L HI (4000K, 80+ CRI) push the beam to 200 m from the same pocket footprint. 700 lm max / 1.5 lm min, single RCR123 (16340), IPX8.\n\nAvailable in Midnight Blue aluminum or Titanium two-tone. ~$85–$106.",
  },
  {
    ...base, model: 'Preon P2.5 MKIII', slug: 'foursevens-preon-p2-5-mkiii',
    max_lumens: 350, min_lumens: 1.5, beam_distance_m: 55,
    emitters: ['Nichia 519A'], battery_type: 'AAA', battery_count: 2, battery_types: ['AAA'], battery_options: [{ type: 'AAA', count: 2 }],
    length_mm: 130, body_diameter_mm: 14.5, weight_g: 45, price_usd: 90,
    description: "A slim 2×AAA penlight-style EDC with a Nichia 519A 9080 (4000K, 92+ CRI) for excellent color. 350 lm max / 1.5 lm min, 55 m throw, up to 90 h runtime.\n\nThe \"P2.5\" is convertible — run it as a shorter P1 with a single AAA (≈150 lm). Aluminum (Type-III anodized) or Copper. ~$90.",
  },
  {
    ...base, model: 'Preon P1 Onibi', slug: 'foursevens-preon-p1-onibi',
    max_lumens: 100, min_lumens: 1, beam_distance_m: 35,
    emitters: ['Nichia 519A'], battery_type: 'AAA', battery_count: 1, battery_types: ['AAA'], battery_options: [{ type: 'AAA', count: 1 }],
    length_mm: 86, body_diameter_mm: 14.5, weight_g: 40, price_usd: 150, material: 'Titanium',
    description: "A Foursevens × Carryology collaboration: a single-AAA EDC in 6Al/4V (Grade 5) titanium with a Type-II anodized aluminum head. Nichia 519A 9080 (4000K, 90+ CRI), 100 lm max / 1 lm min, 35 m throw, up to 45 h runtime. IPX8. The \"Onibi\" edition. ~$150.",
  },
]

async function main() {
  const { error: bErr } = await supabase.from('brands').upsert(brand, { onConflict: 'name' })
  if (bErr) { console.error('Brand upsert failed:', bErr.message); process.exit(1) }
  console.log('✓ brand: Foursevens')

  for (const f of flashlights) {
    console.log(`\n${f.brand} ${f.model}  (${f.slug})`)
    const blobUrls = await hostImages(f.slug, IMAGES[f.slug] ?? [])
    const { error } = await supabase.from('flashlights').upsert({ ...f, image_url: blobUrls[0] ?? null }, { onConflict: 'slug' })
    if (error) { console.error(`  ✗ row:`, error.message); process.exit(1) }
    const { data: fl } = await supabase.from('flashlights').select('id').eq('slug', f.slug).single()
    if (fl?.id) {
      await supabase.from('flashlight_images').delete().eq('flashlight_id', fl.id)
      const extras = blobUrls.slice(1).map((url, i) => ({ flashlight_id: fl.id, url, sort_order: i + 1 }))
      if (extras.length) {
        const { error: imgErr } = await supabase.from('flashlight_images').insert(extras)
        if (imgErr) { console.error(`  ✗ images:`, imgErr.message); process.exit(1) }
      }
    }
    console.log(`  ✓ saved with ${blobUrls.length} image(s)`)
  }
  console.log('\nDone.')
}

main()
