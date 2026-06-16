'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Search, X, Menu } from 'lucide-react'
import UserMenu from '@/components/UserMenu'
import ThemeToggle from '@/components/ThemeToggle'
import InfoMenu from '@/components/InfoMenu'
import { NAV, INFO_NAV } from '@/lib/nav'

// The browse page keeps its own floating header (separate from components/Header
// for the search field). Self-contained: owns nav-open + pointer-glow state, only
// the search value is lifted to the parent so it can drive the query.
export default function BrowseHeader({
  search,
  onSearchChange,
}: {
  search: string
  onSearchChange: (value: string) => void
}) {
  const [navOpen, setNavOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Liquid-glass: feed the pointer position to CSS vars so a specular highlight
  // tracks the cursor across the header (set on the DOM, no re-render).
  function trackHeaderPointer(e: React.PointerEvent<HTMLElement>) {
    const el = headerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`)
    el.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`)
  }

  return (
    <header
      ref={headerRef}
      onPointerMove={trackHeaderPointer}
      className="floating-nav lg-surface sticky top-4 z-50 mx-auto mt-4 rounded-[22px] text-[#f3f3f0]"
      style={{ width: 'min(1224px, calc(100% - 56px))' }}
    >
      <div className="relative z-[1] flex items-center gap-8 px-[22px] h-14">
        <Link href="/" className="font-extrabold text-[17px] tracking-[-0.02em] shrink-0" onClick={() => setNavOpen(false)}>
          <span style={{ color: '#eba00b' }}>torch</span><span className="text-[#f3f3f0]">.EDC.wiki</span>
        </Link>
        <nav className="hidden sm:flex gap-0.5 text-sm font-medium">
          {NAV.map(n => {
            const active = n.href === '/'
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`px-3 py-1.5 rounded-full transition-colors ${
                  active
                    ? 'text-[#f3f3f0] bg-[#ffe8c8]/[0.13] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                    : 'text-[#f3f3f0]/60 hover:text-[#f3f3f0] hover:bg-[#ffe8c8]/[0.08]'
                }`}
              >
                {n.label}
              </Link>
            )
          })}
          <InfoMenu />
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="glass-dark hidden sm:flex items-center gap-2 rounded-full px-3.5 h-[34px] w-60">
            <Search size={15} className="text-[#f3f3f0]/65 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent text-[#f3f3f0] text-[13px] w-full focus:outline-none placeholder-[#f3f3f0]/50"
            />
            {search && (
              <button onClick={() => onSearchChange('')} aria-label="Clear search">
                <X size={14} className="text-[#f3f3f0]/60 hover:text-[#f3f3f0]" />
              </button>
            )}
          </div>
          <button
            className="sm:hidden flex items-center justify-center text-[#f3f3f0]/70 hover:text-[#f3f3f0]"
            onClick={() => setNavOpen(o => !o)}
            aria-label="Menu"
            aria-expanded={navOpen}
          >
            {navOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      {/* Mobile nav dropdown - includes search on small screens */}
      {navOpen && (
        <nav className="relative z-[1] sm:hidden border-t border-white/10 px-[22px] py-3 flex flex-col gap-0.5">
          <div className="glass-dark flex items-center gap-2 rounded-full px-3.5 h-[34px] mb-2">
            <Search size={15} className="text-[#f3f3f0]/65 shrink-0" />
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent text-[#f3f3f0] text-[13px] w-full focus:outline-none placeholder-[#f3f3f0]/50"
            />
          </div>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} onClick={() => setNavOpen(false)}
              className="text-sm text-[#f3f3f0]/60 hover:text-[#f3f3f0] py-2.5 border-b border-white/10 last:border-0">
              {n.label}
            </Link>
          ))}
          <p className="text-[11px] uppercase tracking-wide text-[#f3f3f0]/40 pt-3 pb-1">Information</p>
          {INFO_NAV.map(n => (
            <Link key={n.href} href={n.href} onClick={() => setNavOpen(false)}
              className="text-sm text-[#f3f3f0]/60 hover:text-[#f3f3f0] py-2.5 border-b border-white/10 last:border-0">
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
