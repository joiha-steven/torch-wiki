'use client'

import Link from 'next/link'
import { TriangleAlert, RotateCw, Home } from 'lucide-react'

// Shared presentational error UI used by the app's error boundaries.
export default function ErrorState({
  reset,
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Try again, or head back to browsing.',
}: {
  reset: () => void
  title?: string
  message?: string
}) {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="glass-card w-full max-w-md rounded-[18px] p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-500">
          <TriangleAlert size={24} aria-hidden />
        </div>
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--ink)' }}>{title}</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--ink-2)' }}>{message}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-brand-400"
            style={{ color: 'var(--accent-ink)' }}
          >
            <RotateCw size={15} aria-hidden /> Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/[0.03]"
            style={{ border: '1px solid var(--border)', color: 'var(--ink)' }}
          >
            <Home size={15} aria-hidden /> Home
          </Link>
        </div>
      </div>
    </main>
  )
}
