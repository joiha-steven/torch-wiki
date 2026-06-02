'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { User } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function UserMenu() {
  const { user, nickname, isAdmin, isModerator, signOut, openAuthModal } = useAuth()
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
        <User size={20} strokeWidth={1.75} style={{ color: '#eba00b' }} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 bg-white rounded-xl shadow-lg border border-slate-100 py-1 w-48 z-50 text-sm">
          {nickname ? (
            <Link
              href={`/u/${nickname}`}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-slate-900 text-[15px] font-semibold truncate hover:bg-slate-50"
            >
              {nickname}
            </Link>
          ) : (
            <p className="px-4 py-2.5 text-slate-500 text-xs truncate font-medium">{user.email}</p>
          )}
          <div className="border-t border-slate-100 my-1" />
          <Link href="/account" onClick={() => setOpen(false)} className="block px-4 py-2 text-slate-700 hover:bg-slate-50">
            My Account
          </Link>
          <Link href="/my" onClick={() => setOpen(false)} className="block px-4 py-2 text-slate-700 hover:bg-slate-50">
            My Library
          </Link>
          <Link href="/contribute" onClick={() => setOpen(false)} className="block px-4 py-2 text-slate-700 hover:bg-slate-50">
            My Contribute
          </Link>
          {(isAdmin || isModerator) && (
            <>
              <div className="border-t border-slate-100 my-1" />
              <Link href="/admin" onClick={() => setOpen(false)} className="block px-4 py-2 text-brand-600 hover:bg-brand-50 font-medium">
                {isAdmin ? 'Admin panel' : 'Review queue'}
              </Link>
            </>
          )}
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
