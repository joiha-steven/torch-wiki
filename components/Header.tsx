'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import UserMenu from './UserMenu'
import ThemeToggle from './ThemeToggle'

const NAV = [
  { href: '/',        label: 'Browse' },
  { href: '/brands',  label: 'Brands' },
  { href: '/top',     label: 'Top' },
  { href: '/compare', label: 'Compare' },
  { href: '/updates', label: 'Updates' },
  { href: '/report',  label: 'Report' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)

  // Liquid-glass: write the pointer position to CSS vars so a specular
  // highlight can follow the cursor across the capsule. Set straight on the
  // DOM node (no React re-render) so it stays smooth.
  function trackPointer(e: React.PointerEvent<HTMLElement>) {
    const el = navRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`)
    el.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`)
  }

  return (
    <header
      ref={navRef}
      onPointerMove={trackPointer}
      className="floating-nav lg-surface sticky top-4 z-50 mx-auto mt-4 rounded-[22px] text-[#f3f3f0]"
      style={{ width: 'min(1224px, calc(100% - 56px))' }}
    >
      <div className="relative z-[1] flex items-center gap-8 px-[22px] h-14">
        <Link
          href="/"
          className="font-extrabold text-[17px] tracking-[-0.02em] shrink-0"
          onClick={() => setOpen(false)}
        >
          <span style={{ color: '#eba00b' }}>torch</span>
          <span className="text-[#f3f3f0]">.EDC.wiki</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex gap-0.5">
          {NAV.map(n => {
            const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href)
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
                  active
                    ? 'text-[#f3f3f0] bg-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                    : 'text-[#f3f3f0]/60 hover:text-[#f3f3f0] hover:bg-white/[0.06]'
                }`}
              >
                {n.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            className="sm:hidden flex items-center justify-center text-[#f3f3f0]/70 hover:text-[#f3f3f0]"
            onClick={() => setOpen(o => !o)}
            aria-label="Menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="relative z-[1] sm:hidden border-t border-white/10 px-[22px] py-3 flex flex-col gap-0.5">
          {NAV.map(n => {
            const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href)
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`text-sm py-2.5 border-b border-white/10 last:border-0 ${
                  active ? 'text-[#f3f3f0]' : 'text-[#f3f3f0]/60 hover:text-[#f3f3f0]'
                }`}
              >
                {n.label}
              </Link>
            )
          })}
        </nav>
      )}
    </header>
  )
}
