#!/usr/bin/env node
// Pre-deploy quality gate. Runs every check that must pass BEFORE pushing to
// main (Vercel auto-deploys main → prod). Smoke is intentionally NOT here — it
// verifies the *deployed* site, so it runs AFTER deploy (npm run smoke; see
// 06_Wiki/runbook.md). Exits 1 if any gate fails.
//
// Gates: build · typecheck · lint · tests · zero `any` types · every source file ≤400 lines.

import { execSync } from 'node:child_process'
import { readFileSync, globSync } from 'node:fs'

const MAX_LINES = 400
const results = []

function run(label, fn) {
  process.stdout.write(`▶ ${label}…\n`)
  try {
    fn()
    results.push({ label, ok: true })
  } catch (err) {
    results.push({ label, ok: false, detail: err.message?.split('\n')[0] })
  }
}

function sh(cmd) {
  execSync(cmd, { stdio: 'inherit' })
}

run('Build (next build)', () => sh('npm run build'))
run('Type check (tsc --noEmit)', () => sh('npm run typecheck'))
run('Lint (eslint)', () => sh('npm run lint'))
run('Unit tests (vitest)', () => sh('npm test'))

run('No `any` types', () => {
  const files = globSync('{app,components,lib}/**/*.{ts,tsx}')
  const offenders = []
  for (const f of files) {
    const lines = readFileSync(f, 'utf8').split('\n')
    lines.forEach((line, i) => {
      if (/:\s*any\b/.test(line)) offenders.push(`${f}:${i + 1}`)
    })
  }
  if (offenders.length) throw new Error(`found ${offenders.length}: ${offenders.slice(0, 5).join(', ')}`)
})

run(`All source files ≤${MAX_LINES} lines`, () => {
  const files = globSync('{app,components,lib}/**/*.{ts,tsx}')
  const tooLong = files
    .map((f) => [f, readFileSync(f, 'utf8').split('\n').length])
    .filter(([, n]) => n > MAX_LINES)
  if (tooLong.length) {
    throw new Error(tooLong.map(([f, n]) => `${f} (${n})`).join(', '))
  }
})

console.log('\n──────── pre-deploy summary ────────')
for (const r of results) {
  console.log(`${r.ok ? '✅' : '❌'} ${r.label}${r.detail ? ` — ${r.detail}` : ''}`)
}

const failed = results.filter((r) => !r.ok)
if (failed.length) {
  console.log(`\n${failed.length} gate(s) failed. Fix before deploying.`)
  process.exit(1)
}
console.log('\nAll gates passed. Safe to push → deploy.')
