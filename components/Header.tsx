'use client'

import Link from 'next/link'
import UserMenu from './UserMenu'

export default function Header() {
  return (
    <header className="bg-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-11 flex items-center gap-6">
        <Link href="/" className="font-bold text-base shrink-0">
          <span style={{ color: '#FFBE00' }}>torch.</span><span className="text-white">EDC.wiki</span>
        </Link>
        <nav className="hidden sm:flex gap-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-white">Browse</Link>
          <Link href="/compare" className="hover:text-white">Compare</Link>
          <Link href="/updates" className="hover:text-white">Updates</Link>
        </nav>
        <div className="ml-auto"><UserMenu /></div>
      </div>
    </header>
  )
}
