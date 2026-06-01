'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import UserMenu from './UserMenu'

const NAV = [
  { href: '/',        label: 'Browse' },
  { href: '/compare', label: 'Compare' },
  { href: '/updates', label: 'Updates' },
  { href: '/report',  label: 'Report' },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-11 flex items-center gap-6">
        <Link href="/" className="font-bold text-base shrink-0" onClick={() => setOpen(false)}>
          <span style={{ color: '#FFBE00' }}>torch.</span><span className="text-white">EDC.wiki</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex gap-4 text-sm text-gray-500">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className="hover:text-white">{n.label}</Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            className="sm:hidden flex items-center justify-center text-gray-400 hover:text-white"
            onClick={() => setOpen(o => !o)}
            aria-label="Menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
          <UserMenu />
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="sm:hidden bg-zinc-950 border-t border-zinc-800 px-4 py-3 flex flex-col gap-0.5">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="text-sm text-gray-400 hover:text-white py-2.5 border-b border-zinc-800 last:border-0"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
