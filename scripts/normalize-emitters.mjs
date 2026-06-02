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

// Canonical: Brand in proper case (not ALL-CAPS), Cree XHP series hyphenated (XHP70.2 -> XHP-70.2)
const EMITTER_MAP = {
  'CREE XHP70.2':     'Cree XHP-70.2',
  'Cree XHP70.2':     'Cree XHP-70.2',
  'Cree XHP70.2 HI':  'Cree XHP-70.2 HI',
  'CREE XHP70.3 HI':  'Cree XHP-70.3 HI',
  'Cree XHP50.3 HI':  'Cree XHP-50.3 HI',
  'Cree XHP70 2nd':   'Cree XHP-70 2nd',
  'CREE XP-LR':       'Cree XP-LR',
  'LUXEON HL4X':      'Luxeon HL4X',
  'SST-36R':          'Luminus SST-36R',
}

// Acebeam lights actually powered by 16340 (RCR123) that were stored as CR123A
const BATTERY_FIXES = {
  'acebeam-w20':    '16340',
  'acebeam-e10-20': '16340',
  'acebeam-g10':    '16340',
}

async function run() {
  // --- 1. Battery type fixes ---
  console.log('=== Battery fixes ===')
  for (const [slug, bt] of Object.entries(BATTERY_FIXES)) {
    const { error } = await supabase.from('flashlights').update({ battery_type: bt }).eq('slug', slug)
    console.log(error ? `  [err] ${slug}: ${error.message}` : `  [ok]  ${slug} -> ${bt}`)
  }

  // --- 2. Emitter normalization ---
  console.log('\n=== Emitter normalization ===')
  const { data, error } = await supabase.from('flashlights').select('id, slug, emitters')
  if (error) { console.error(error.message); process.exit(1) }

  let changed = 0
  for (const f of data) {
    const orig = f.emitters || []
    if (orig.length === 0) continue

    // Apply map, then dedupe preserving order
    const mapped = orig.map(e => EMITTER_MAP[e] ?? e)
    const deduped = [...new Set(mapped)]

    const isSame = deduped.length === orig.length && deduped.every((v, i) => v === orig[i])
    if (isSame) continue

    const { error: ue } = await supabase.from('flashlights').update({ emitters: deduped }).eq('id', f.id)
    if (ue) { console.log(`  [err] ${f.slug}: ${ue.message}`); continue }
    console.log(`  [ok]  ${f.slug}: [${orig.join(', ')}] -> [${deduped.join(', ')}]`)
    changed++
  }

  console.log(`\nDone — ${changed} rows had emitters normalized`)
}

run().catch(console.error)
