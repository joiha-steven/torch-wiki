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
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return { buf: Buffer.from(await res.arrayBuffer()), ct: res.headers.get('content-type') ?? 'image/jpeg' }
}

// Download each source image and re-host on Vercel Blob; returns blob URLs (first = primary)
async function hostImages(slug, urls) {
  const out = []
  for (let i = 0; i < urls.length; i++) {
    const { buf, ct } = await download(urls[i])
    const name = i === 0 ? `primary${getExt(urls[i])}` : `${i}${getExt(urls[i])}`
    const { url } = await put(`flashlights/${slug}/${name}`, buf, {
      access: 'public', token: BLOB_TOKEN, contentType: ct, addRandomSuffix: true,
    })
    out.push(url)
    console.log(`    · ${name} → blob`)
  }
  return out
}

const CDN = 'https://cdn.shopify.com/s/files/1/1356/1883'
// Curated source images per light (first = primary)
const IMAGES = {
  'prometheus-alpha': [
    `${CDN}/products/Custom-Edit-2400.jpg`,
    `${CDN}/products/Alpha_2.jpg`,
    `${CDN}/products/Prometheus-Alpha-6.jpg`,
    `${CDN}/products/boot-glow-2400_501f0558-768f-4580-af16-3ac0b1a79792.jpg`,
  ],
  'prometheus-alpha-shorty': [
    `${CDN}/products/Shorty-3up_b6b01661-a9cb-4c5e-ac82-63ae6f1d6afd.jpg`,
    `${CDN}/products/Shorty-BP_15edf0b8-13cc-4986-b597-3e5da88754cc.jpg`,
    `${CDN}/products/Shorty-SW_41188b34-78ae-4ec8-b3d8-34b52b6a9620.jpg`,
    `${CDN}/products/Shorty-BR_802d52f1-a848-4f62-9c46-798e8ef29c3c.jpg`,
  ],
  'prometheus-beta-qrv3': [
    `${CDN}/files/brass-copper_892c2844-d119-432a-a9ba-21e8d9d04662.jpg`,
    `${CDN}/files/BRASS-V3-2UP.jpg`,
    `${CDN}/files/COPPER-V3-2UP.jpg`,
  ],
  'prometheus-delta': [
    `${CDN}/products/delta-custom-front.jpg`,
    `${CDN}/products/delta-custom-back.jpg`,
    `${CDN}/products/Prometheus_Lights_Alpha_Shorty_Delta_Comparison_90b9e0f4-41c1-4294-bfd0-530aa2882fd8.jpg`,
    `${CDN}/products/GLOW_d34c9f59-141a-40db-909e-a0ce42e7019b.jpg`,
  ],
  'prometheus-beta-qrv2-chroma': [
    `${CDN}/products/beta-chroma-rgba.jpg`,
    `${CDN}/products/beta-chroma-rgba-ON.jpg`,
    `${CDN}/products/Blue_Beta_on_rock.jpg`,
  ],
  'prometheus-beta-qrv2-365uv': [
    `${CDN}/products/Beta_UV365_Flashlight_02.jpg`,
    `${CDN}/products/Beta_UV365_Flashlight_03.jpg`,
    `${CDN}/products/uv-watch-lume.jpg`,
    `${CDN}/products/Beta-QRv2-Purple-UV-Dark-2400.jpg`,
  ],
}

// ── Brand ──────────────────────────────────────────────────────────────────
const brand = {
  name: 'Prometheus',
  country: 'USA',
  made_in: 'USA',
  founded_year: 2011,
  website: 'https://prometheuslights.com',
  about: 'Prometheus Lights is a small American maker of high-end everyday-carry flashlights, pens and gear, founded in 2011 by Jason Hui. Lights are machined in the USA with a focus on simplicity, durability and fine finishing, and the team also owns the Foursevens brand. Most models are offered in a wide range of materials and finishes — aluminum, titanium, copper, brass and carbon — and in limited special editions.',
}

// ── Flashlights ──────────────────────────────────────────────────────────────
// Materials/finishes and price ranges are noted in each description rather than
// split into separate rows. Buyer's-choice emitter models leave `emitters` empty.
const flashlights = [
  {
    brand: 'Prometheus', model: 'Alpha', slug: 'prometheus-alpha', category: 'Custom',
    max_lumens: 750, min_lumens: 0.5, beam_distance_m: 110,
    emitters: [], battery_type: '18650', battery_count: 1,
    battery_types: ['18650'], battery_options: [{ type: '18650', count: 1 }],
    charging_type: 'none', has_usb_charging: false,
    length_mm: 146, head_diameter_mm: null, body_diameter_mm: 25.4, weight_g: 136,
    ip_rating: 'IPX8', impact_resistance_m: null, price_usd: 375, material: 'Aluminum',
    description: "Prometheus Lights' flagship single-18650 EDC flashlight — a side-switch light with fully user-programmable output (default Low/Med/High, plus Strobe/Beacon/SOS), buyer's-choice emitter, 98% UCL anti-reflective glass and a titanium pocket clip. Rated IPX8 and tested to 300 ft (100 m) submersion for 5 hours.\n\n**Output:** 650–750 lm max · 0.5 lm min · 110 m beam · 1.5 h–270 h runtime.\n\n**Materials & finishes:** 6061-T6 aluminum (Electroless Nickel), Classic anodized, Titanium (stone-washed or raw machined), Carbon, MIL/LEO, and limited Special Editions (some with tritium). Roughly $335–$900 depending on material/edition (Custom $375).",
    is_discontinued: false,
  },
  {
    brand: 'Prometheus', model: 'Alpha Shorty', slug: 'prometheus-alpha-shorty', category: 'Custom',
    max_lumens: 850, min_lumens: 0.5, beam_distance_m: 110,
    emitters: [], battery_type: '18350', battery_count: 1,
    battery_types: ['18350'], battery_options: [{ type: '18350', count: 1 }],
    charging_type: 'none', has_usb_charging: false,
    length_mm: 121, head_diameter_mm: null, body_diameter_mm: 25.4, weight_g: 108,
    ip_rating: 'IPX8', impact_resistance_m: null, price_usd: 335, material: 'Aluminum',
    description: "A compact version of the Alpha using the same head and tailcap with a shorter body and an 18350 cell (about 1/3 the capacity), making it roughly an inch shorter. Buyer's-choice emitter, UCL glass and titanium clip. IPX8, tested to 300 ft submersion. Requires IMR 18350 cells.\n\n**Output:** up to 850 lm · 0.5 lm min · 110 m beam.\n\n**Materials & finishes:** 6061-T6 aluminum (Electroless Nickel) in Blasted & Polished, Stone Wash or Brushed; also a Classic Triple and Titanium. Roughly $335–$650 (Classic $335, Titanium up to $650).",
    is_discontinued: false,
  },
  {
    brand: 'Prometheus', model: 'Beta QRv3', slug: 'prometheus-beta-qrv3', category: 'Custom',
    max_lumens: 90, min_lumens: 1, beam_distance_m: null,
    emitters: ['Nichia 519A'], battery_type: 'AAA', battery_count: 1,
    battery_types: ['AAA'], battery_options: [{ type: 'AAA', count: 1 }],
    charging_type: 'none', has_usb_charging: false,
    length_mm: 75, head_diameter_mm: null, body_diameter_mm: 14, weight_g: 37,
    ip_rating: 'IPX8', impact_resistance_m: null, price_usd: 145, material: 'Aluminum',
    description: "The third-generation Beta — a tiny AAA keychain/EDC light with Prometheus' Quick Release (QR) mechanism. Runs on a rechargeable NiMH AAA or a disposable lithium AAA (no Li-ion). High-CRI Nichia 519A (4000K, 90+ CRI).\n\n**Output:** 90 lm max · 1 lm min · 50 min–50 h runtime · IPX8 (1 m).\n\n**Materials & finishes:** Raw/Velvet Brass, Raw/Velvet Copper, Electroless Nickel, HAIII Black, and Titanium editions. Copper/brass weigh ~59 g; Electroless Nickel / HAIII ~37 g. Roughly $145–$295.",
    is_discontinued: false,
  },
  {
    brand: 'Prometheus', model: 'Delta', slug: 'prometheus-delta', category: 'Custom',
    max_lumens: 1100, min_lumens: 0.5, beam_distance_m: null,
    emitters: [], battery_type: '18350', battery_count: 1,
    battery_types: ['18350'], battery_options: [{ type: '18350', count: 1 }],
    charging_type: 'none', has_usb_charging: false,
    length_mm: 95, head_diameter_mm: null, body_diameter_mm: 25.4, weight_g: null,
    ip_rating: 'IPX8', impact_resistance_m: null, price_usd: 375, material: 'Aluminum',
    description: "A short 18350 EDC that introduced Prometheus' user-swappable optics and graphite thermal pads (now standard across the line). Comparable output to the Alpha in a smaller package, trading runtime for size. Buyer's-choice emitter, UCL glass, titanium clip and a Tellurium-copper pill. Requires IMR 18350 cells.\n\n**Output:** 850–1100 lm max · 0.5 lm min · 0.5 h–90 h runtime · IPX8 (10 m).\n\n**Materials & finishes:** 6061-T6 aluminum (Electroless Nickel), Titanium, solid Copper, solid Brass, Blasted Hex Electroless Nickel, Black Marble, plus Special/Tritium editions. An 18650 extension body is available. Roughly $335–$900 (Custom $375).",
    is_discontinued: false,
  },
  {
    brand: 'Prometheus', model: 'Beta QRv2 Chroma', slug: 'prometheus-beta-qrv2-chroma', category: 'Custom',
    max_lumens: null, min_lumens: null, beam_distance_m: null,
    emitters: ['Cree XP-E'], battery_type: 'AAA', battery_count: 1,
    battery_types: ['AAA'], battery_options: [{ type: 'AAA', count: 1 }],
    charging_type: 'none', has_usb_charging: false,
    length_mm: 75, head_diameter_mm: null, body_diameter_mm: 14, weight_g: 34,
    ip_rating: 'IPX8', impact_resistance_m: null, price_usd: 65, material: 'Aluminum',
    description: "A colored-LED version of the second-generation Beta (QRv2), aimed at photography, navigation and signalling rather than general lighting. Cree XP-E emitter available in Blue (470 nm), Green (525 nm), Amber (595 nm) or Red (635 nm). Output is rated in milliwatts, not lumens (520 mW red/amber, 700 mW green/blue).\n\nRuns on NiMH AAA or lithium AAA. Type II anodized 6061 aluminum, IPX8 (1 m), made in USA. $65.",
    is_discontinued: false,
  },
  {
    brand: 'Prometheus', model: 'Beta QRv2 365UV', slug: 'prometheus-beta-qrv2-365uv', category: 'Custom',
    max_lumens: null, min_lumens: null, beam_distance_m: null,
    emitters: ['LG 3535 UV'], battery_type: 'AAA', battery_count: 1,
    battery_types: ['AAA'], battery_options: [{ type: 'AAA', count: 1 }],
    charging_type: 'none', has_usb_charging: false,
    length_mm: 75, head_diameter_mm: null, body_diameter_mm: 14, weight_g: 37,
    ip_rating: 'IPX8', impact_resistance_m: null, price_usd: 79, material: 'Aluminum',
    description: "A 365 nm ultraviolet version of the QRv2 Beta for fluorescence, inspection and curing tasks. LG 3535 365 nm UV emitter with ~90% output in the UV spectrum and two modes (550 mW / 1100 mW). Output is rated in milliwatts, not lumens.\n\nRuns on NiMH AAA or lithium AAA, ~60 min runtime. Type II anodized 6061 aluminum, IPX8 (1 m), made in USA. $79.",
    is_discontinued: false,
  },
]

async function main() {
  const { error: bErr } = await supabase.from('brands').upsert(brand, { onConflict: 'name' })
  if (bErr) { console.error('Brand upsert failed:', bErr.message); process.exit(1) }
  console.log('✓ brand: Prometheus')

  for (const f of flashlights) {
    console.log(`\n${f.brand} ${f.model}  (${f.slug})`)
    // 1) Re-host images on Vercel Blob (first = primary)
    const blobUrls = await hostImages(f.slug, IMAGES[f.slug] ?? [])

    // 2) Upsert the flashlight row with the primary image set in the same write
    const { error } = await supabase
      .from('flashlights')
      .upsert({ ...f, image_url: blobUrls[0] ?? null }, { onConflict: 'slug' })
    if (error) { console.error(`  ✗ row:`, error.message); process.exit(1) }

    // 3) Replace extra images
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

  console.log('\nDone. Now force-clear the cache (admin → Force clear cache) so the new pages render.')
}

main()
