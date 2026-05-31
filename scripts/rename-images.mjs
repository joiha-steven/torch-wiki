/**
 * rename-images.mjs
 *
 * Script chạy 1 lần để đổi tên ảnh trong Vercel Blob sang format SEO-friendly:
 *   {brand}-{model-slug}-1.jpg
 *
 * Cách dùng:
 *   node scripts/rename-images.mjs
 *
 * Cần có trong .env.local:
 *   BLOB_READ_WRITE_TOKEN=...
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...  (service role, không phải anon)
 */

import { list, put, del } from '@vercel/blob'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Load .env.local thủ công
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => l.split('=').map(s => s.trim()))
)

const BLOB_TOKEN = env['BLOB_READ_WRITE_TOKEN']
const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SUPABASE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

if (!BLOB_TOKEN || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Thiếu env vars. Kiểm tra .env.local có đủ 3 key không.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function getExt(url) {
  const path = new URL(url).pathname
  const ext = path.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'webp'].includes(ext ?? '') ? ext : 'jpg'
}

async function run() {
  // Lấy tất cả flashlights có ảnh
  const { data: flashlights, error } = await supabase
    .from('flashlights')
    .select('id, brand, model, image_url')
    .not('image_url', 'is', null)

  if (error) { console.error('Supabase error:', error); process.exit(1) }

  console.log(`Tìm thấy ${flashlights.length} đèn có ảnh\n`)

  for (const f of flashlights) {
    const url = f.image_url
    const newName = `${toSlug(f.brand)}-${toSlug(f.model)}-1.${getExt(url)}`

    // Bỏ qua nếu URL đã đúng tên
    if (url.includes(newName)) {
      console.log(`⏭  ${f.model} — tên đã đúng`)
      continue
    }

    try {
      // Download ảnh
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buffer = await res.arrayBuffer()

      // Upload lên Vercel Blob với tên mới
      const { url: newUrl } = await put(newName, buffer, {
        access: 'public',
        token: BLOB_TOKEN,
        addRandomSuffix: false,
      })

      // Xóa blob cũ nếu nó nằm trên Vercel Blob (không xóa URL ngoài)
      if (url.includes('vercel-storage.com') || url.includes('blob.vercel')) {
        await del(url, { token: BLOB_TOKEN })
      }

      // Cập nhật database
      await supabase
        .from('flashlights')
        .update({ image_url: newUrl })
        .eq('id', f.id)

      console.log(`✓  ${f.brand} ${f.model}\n   ${url}\n → ${newUrl}\n`)
    } catch (err) {
      console.error(`✗  ${f.brand} ${f.model}: ${err.message}`)
    }
  }

  console.log('Xong!')
}

run()
