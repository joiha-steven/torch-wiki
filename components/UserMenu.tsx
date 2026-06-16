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
      <button
        onClick={openAuthModal}
        aria-label="Sign in"
        className="glass-dark w-[34px] h-[34px] grid place-items-center rounded-full text-[#f3f3f0]/90"
      >
        <User size={19} strokeWidth={1.8} />
      </button>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        className="glass-dark w-[34px] h-[34px] grid place-items-center rounded-full"
      >
        <User size={19} strokeWidth={1.8} style={{ color: '#eba00b' }} />
      </button>

      {open && (
        <div className="absolute right-0 top-11 bg-panel rounded-xl shadow-lg border border-line py-1 w-48 z-50 text-sm">
          {nickname ? (
            <Link
              href={`/u/${nickname}`}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-ink text-[15px] font-semibold truncate hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/5"
            >
              {nickname}
            </Link>
          ) : (
            <p className="px-4 py-2.5 text-ink-3 text-xs truncate font-medium">{user.email}</p>
          )}
          <div className="border-t border-line my-1" />
          <Link href="/account" onClick={() => setOpen(false)} className="block px-4 py-2 text-ink-2 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/5">
            My Account
          </Link>
          <Link href="/my" onClick={() => setOpen(false)} className="block px-4 py-2 text-ink-2 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/5">
            My Library
          </Link>
          <Link href="/contribute" onClick={() => setOpen(false)} className="block px-4 py-2 text-ink-2 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/5">
            My Contribute
          </Link>
          {(isAdmin || isModerator) && (
            <>
              <div className="border-t border-line my-1" />
              <Link href="/admin" onClick={() => setOpen(false)} className="block px-4 py-2 text-brand-600 hover:bg-brand-50 font-medium">
                {isAdmin ? 'Admin panel' : 'Review queue'}
              </Link>
            </>
          )}
          <div className="border-t border-line my-1" />
          <button
            onClick={() => { setOpen(false); signOut() }}
            className="w-full text-left px-4 py-2 text-red-500 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/5"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
