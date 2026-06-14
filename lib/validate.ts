import { NextResponse } from 'next/server'

// Shared, dependency-free input-validation helpers for API routes.
// Guards are defensive: they reject malformed/oversized input early with a 400
// and never alter the behaviour of a valid request.

export const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Generous upper bounds — large enough never to clip legitimate content,
// small enough to stop abuse (multi-MB JSON fields, etc.).
export const MAX = { name: 255, url: 2048, text: 50_000, token: 4096, code: 128 } as const

export const isUuid = (v: unknown): v is string =>
  typeof v === 'string' && UUID_RE.test(v)

export const isEmail = (v: unknown): v is string =>
  typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v)

export const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every(x => typeof x === 'string')

/** Non-empty string no longer than `max` characters. */
export const isStr = (v: unknown, max: number): v is string =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max

/** Optional string (allows null/undefined) capped at `max` characters. */
export const isOptStr = (v: unknown, max: number): boolean =>
  v == null || (typeof v === 'string' && v.length <= max)

/** 400 response with a clear message. */
export function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

/** Parse a JSON body, returning null on malformed input (so callers 400 instead of 500). */
export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T | null> {
  return request.json().catch(() => null) as Promise<T | null>
}
