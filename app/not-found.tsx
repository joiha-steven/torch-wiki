import Link from 'next/link'
import { Home, TriangleAlert } from 'lucide-react'
import Header from '@/components/Header'

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0b] text-[#f3f3f0]">
      {/* Flashlight-beam backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* two beams fanning from the top */}
        <div
          className="absolute top-[-8%] left-[48%] h-[95vh] w-[70vw]"
          style={{
            transform: 'translateX(-50%) rotate(-13deg)',
            transformOrigin: 'top center',
            background: 'linear-gradient(180deg, rgba(235,160,11,0.18) 0%, rgba(235,160,11,0.05) 38%, transparent 70%)',
            clipPath: 'polygon(47% 0%, 53% 0%, 80% 100%, 20% 100%)',
            filter: 'blur(16px)',
            mixBlendMode: 'screen',
          }}
        />
        <div
          className="absolute top-[-8%] left-[52%] h-[95vh] w-[70vw]"
          style={{
            transform: 'translateX(-50%) rotate(13deg)',
            transformOrigin: 'top center',
            background: 'linear-gradient(180deg, rgba(235,160,11,0.16) 0%, rgba(235,160,11,0.045) 38%, transparent 70%)',
            clipPath: 'polygon(47% 0%, 53% 0%, 80% 100%, 20% 100%)',
            filter: 'blur(18px)',
            mixBlendMode: 'screen',
          }}
        />
        {/* warm glow pooled behind the number */}
        <div
          className="absolute left-1/2 top-1/2 h-[60vh] w-[60vw] -translate-x-1/2 -translate-y-1/2"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(235,160,11,0.22), rgba(235,160,11,0.04) 38%, transparent 65%)',
            filter: 'blur(8px)',
          }}
        />
        {/* faint dust specks in the beam */}
        <span className="absolute left-[52%] top-[18%] h-1 w-1 rounded-full bg-[#f4ecd6]/40" />
        <span className="absolute left-[49%] top-[26%] h-[3px] w-[3px] rounded-full bg-[#f4ecd6]/30" />
        <span className="absolute left-[55%] top-[24%] h-[2px] w-[2px] rounded-full bg-[#f4ecd6]/30" />
        <span className="absolute left-[46%] top-[40%] h-[2px] w-[2px] rounded-full bg-[#f4ecd6]/25" />
      </div>

      {/* Foreground */}
      <div className="relative z-10">
        <Header />

        <main className="flex min-h-[78vh] flex-col items-center justify-center px-6 text-center">
          <p className="text-[12px] font-medium uppercase tracking-[0.35em] text-brand-500/80">
            Error 404 · Off the grid
          </p>

          <h1
            className="mt-5 text-[120px] font-extrabold leading-none tracking-[-0.04em] text-[#f4ecd6] sm:text-[200px]"
            style={{ textShadow: '0 0 70px rgba(235,160,11,0.45), 0 0 24px rgba(235,160,11,0.30)' }}
          >
            404
          </h1>

          <h2 className="mt-6 text-2xl font-bold tracking-[-0.01em] text-[#f3f3f0] sm:text-3xl">
            We couldn&apos;t light this one up.
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#f3f3f0]/55">
            This page could not be found — it may have been moved, renamed, or never existed in the catalog.
          </p>

          {/* Buttons — site's own design (amber primary + ghost) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-brand-400"
            >
              <Home size={16} /> Back to Browse
            </Link>
            <Link
              href="/report"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-[#f3f3f0] transition-colors hover:bg-white/10 hover:border-white/25"
            >
              <TriangleAlert size={16} /> Report a broken link
            </Link>
          </div>

          <p className="mt-12 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] text-[#f3f3f0]/40">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> Beam range exceeded
          </p>
        </main>
      </div>
    </div>
  )
}
