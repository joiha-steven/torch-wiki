#!/usr/bin/env node
// Smoke test for the deployed site. No external deps — built-in fetch only.
// Usage: node scripts/smoke.mjs  [baseUrl]
// Default base: https://torch.edc.wiki  (override with arg or SMOKE_BASE env)

const BASE = process.argv[2] || process.env.SMOKE_BASE || 'https://torch.edc.wiki'
const TIMEOUT_MS = 5000

const PAGES = ['/', '/brands', '/compare', '/contribute', '/top', '/log', '/guide', '/privacy', '/terms', '/report']
const SEO = ['/robots.txt', '/sitemap.xml', '/manifest.webmanifest', '/sw.js', '/offline.html']
const API = ['/api/ping']

let passed = 0
let failed = 0

function ok(msg) { console.log(`✅ ${msg}`); passed++ }
function bad(msg) { console.log(`❌ ${msg}`); failed++ }

async function timedFetch(url) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  const start = Date.now()
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'manual' })
    return { res, ms: Date.now() - start }
  } finally {
    clearTimeout(t)
  }
}

async function checkHtml(path) {
  const url = BASE + path
  try {
    const { res, ms } = await timedFetch(url)
    if (res.status !== 200) return bad(`${path} → HTTP ${res.status}`)
    if (ms > TIMEOUT_MS) return bad(`${path} → slow ${ms}ms`)
    const body = await res.text()
    if (!/<!doctype html>|<html/i.test(body)) return bad(`${path} → not HTML`)
    ok(`${path} (${ms}ms)`)
  } catch (e) {
    bad(`${path} → ${e.name === 'AbortError' ? `timeout >${TIMEOUT_MS}ms` : e.message}`)
  }
}

async function checkText(path) {
  const url = BASE + path
  try {
    const { res, ms } = await timedFetch(url)
    if (res.status !== 200) return bad(`${path} → HTTP ${res.status}`)
    ok(`${path} (${ms}ms)`)
  } catch (e) {
    bad(`${path} → ${e.name === 'AbortError' ? `timeout >${TIMEOUT_MS}ms` : e.message}`)
  }
}

async function checkJson(path) {
  const url = BASE + path
  try {
    const { res, ms } = await timedFetch(url)
    if (res.status !== 200) return bad(`${path} → HTTP ${res.status}`)
    const body = await res.text()
    try { JSON.parse(body) } catch { return bad(`${path} → invalid JSON`) }
    ok(`${path} (${ms}ms, JSON)`)
  } catch (e) {
    bad(`${path} → ${e.name === 'AbortError' ? `timeout >${TIMEOUT_MS}ms` : e.message}`)
  }
}

// Fetch homepage, pull the first /<slug> flashlight link, verify it 200s.
async function checkOneDetail() {
  try {
    const { res } = await timedFetch(BASE + '/')
    const html = await res.text()
    // Detail links look like href="/some-slug" — exclude known top-level routes.
    const reserved = new Set(['brands', 'compare', 'contribute', 'top', 'log', 'data-log', 'updates', 'guide', 'privacy', 'terms',
      'account', 'admin', 'my', 'u', 'brand', 'report', 'api', 'reset-password',
      'change-password', 'change-password', 'top', ''])
    const slugs = [...html.matchAll(/href="\/([a-z0-9][a-z0-9-]+)"/gi)]
      .map(m => m[1]).filter(s => !reserved.has(s))
    if (slugs.length === 0) return bad('detail page → no flashlight slug found on homepage')
    const slug = slugs[0]
    const { res: dres, ms } = await timedFetch(BASE + '/' + slug)
    if (dres.status !== 200) return bad(`/${slug} (detail) → HTTP ${dres.status}`)
    ok(`/${slug} (detail, ${ms}ms)`)
  } catch (e) {
    bad(`detail page → ${e.message}`)
  }
}

console.log(`🔦 Smoke test → ${BASE}\n`)
for (const p of PAGES) await checkHtml(p)
for (const p of SEO) await checkText(p)
for (const p of API) await checkJson(p)
await checkOneDetail()

console.log(`\n${passed}/${passed + failed} tests passed`)
process.exit(failed === 0 ? 0 : 1)
