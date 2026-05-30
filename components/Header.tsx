'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Flashlight } from 'lucide-react'

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-amber-400">
          <Flashlight size={20} />
          Torch Wiki
        </Link>
        <nav className="flex gap-4 text-sm text-slate-300">
          <Link href="/" className={pathname === '/' ? 'text-white' : 'hover:text-white'}>
            Browse
          </Link>
          <Link href="/compare" className={pathname === '/compare' ? 'text-white' : 'hover:text-white'}>
            Compare
          </Link>
        </nav>
      </div>
    </header>
  )
}
