'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function UserMenu() {
  const { user, signOut, openAuthModal } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!user) {
    return (
      <button
        onClick={openAuthModal}
        className="text-sm text-gray-300 hover:text-white border border-zinc-600 rounded-lg px-3 py-1 transition-colors"
      >
        Sign in
      </button>
    )
  }

  const initial = (user.email ?? '?')[0].toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black"
        style={{ backgroundColor: '#FFBE00' }}
        title={user.email}
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-9 bg-white rounded-xl shadow-lg border border-slate-100 py-1 w-48 z-50 text-sm">
          <p className="px-4 py-2 text-slate-400 text-xs truncate">{user.email}</p>
          <div className="border-t border-slate-100 my-1" />
          <Link
            href="/my"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-slate-700 hover:bg-slate-50"
          >
            My Lists
          </Link>
          <button
            onClick={() => { setOpen(false); signOut() }}
            className="w-full text-left px-4 py-2 text-red-500 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
