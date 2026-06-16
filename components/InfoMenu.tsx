'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { INFO_NAV } from '@/lib/nav'

// "Information" dropdown in the floating nav — groups the Log + Guide pages.
// Trigger matches the dark nav links; the panel matches the user menu (UserMenu)
// so the two dropdowns share one look.
export default function InfoMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const active = INFO_NAV.some(n => pathname.startsWith(n.href))

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
          active
            ? 'text-[#f3f3f0] bg-[#ffe8c8]/[0.13] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
            : 'text-[#f3f3f0]/60 hover:text-[#f3f3f0] hover:bg-[#ffe8c8]/[0.08]'
        }`}
      >
        Information
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-11 bg-panel rounded-xl shadow-lg border border-line py-1 w-48 z-50 text-sm" role="menu">
          {INFO_NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              role="menuitem"
              className="block px-4 py-2 text-ink-2 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/5"
            >
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
