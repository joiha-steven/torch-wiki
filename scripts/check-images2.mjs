import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envFile = readFileSync(join(__dirname, '../.env.local'), 'utf-8')
const env = Object.fromEntries(
  envFile.split('\n').filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"(.*)"$/s, '$1')] })
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
function host(url) { try { return new URL(url).hostname } catch { return '(invalid)' } }
async function head(url) {
  try { const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' } }); return res.status }
  catch (e) { return `ERR ${e.message}` }
}

const items = []

// brand logos
const { data: brands } = await supabase.from('brands').select('slug, logo_url, about')
for (const b of (brands ?? [])) {
  if (b.logo_url) items.push({ kind: 'brand-logo', ref: b.slug, url: b.logo_url })
  // markdown inline images in about
  for (const m of (b.about ?? '').matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) items.push({ kind: 'brand-about-img', ref: b.slug, url: m[1] })
}

// flashlight description markdown images
const { data: fls } = await supabase.from('flashlights').select('slug, description')
for (const f of (fls ?? [])) {
  for (const m of (f.description ?? '').matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) items.push({ kind: 'desc-img', ref: f.slug, url: m[1] })
}

console.log(`Non-product image refs found: ${items.length}`)
const byHost = {}
for (const it of items) byHost[host(it.url)] = (byHost[host(it.url)] ?? 0) + 1
console.log('\nBy hostname:')
for (const [h, n] of Object.entries(byHost).sort((a, b) => b[1] - a[1])) console.log(`  ${n.toString().padStart(4)}  ${h}`)

const broken = []
for (const it of items) { const s = await head(it.url); if (s !== 200 && s !== 206) broken.push({ ...it, status: s }) }
console.log(`\n=== Broken: ${broken.length} ===`)
for (const b of broken) console.log(`  [${b.status}] ${b.kind} ${b.ref}\n        ${b.url}`)
