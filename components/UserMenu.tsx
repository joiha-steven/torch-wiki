'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { User } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function UserMenu() {
  const { user, nickname, signOut, openAuthModal } = useAuth()
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
      <button onClick={openAuthModal} className="flex items-center justify-center hover:opacity-70 transition-opacity">
        <User size={20} strokeWidth={1.75} className="text-white" />
      </button>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center justify-center hover:opacity-70 transition-opacity">
        <User size={20} strokeWidth={1.75} style={{ color: '#FFBE00' }} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 bg-white rounded-xl shadow-lg border border-slate-100 py-1 w-48 z-50 text-sm">
          <p className="px-4 py-2 text-slate-500 text-xs truncate font-medium">{nickname ?? user.email}</p>
          <div className="border-t border-slate-100 my-1" />
          <Link href="/my" onClick={() => setOpen(false)} className="block px-4 py-2 text-slate-700 hover:bg-slate-50">
            My Lists
          </Link>
          <Link href="/contribute" onClick={() => setOpen(false)} className="block px-4 py-2 text-slate-700 hover:bg-slate-50">
            Contribute
          </Link>
          <Link href="/account" onClick={() => setOpen(false)} className="block px-4 py-2 text-slate-700 hover:bg-slate-50">
            My Account
          </Link>
          <div className="border-t border-slate-100 my-1" />
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
