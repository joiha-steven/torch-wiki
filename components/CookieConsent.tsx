'use client'

import Link from 'next/link'
import { useConsent, setConsent } from '@/lib/use-consent'

export default function CookieConsent() {
  const consent = useConsent()

  // Only show until the visitor makes a choice.
  if (consent !== null) return null

  return (
    // Full-width track so the card aligns to the page content's left edge
    // (not the raw viewport edge) on wide screens. Track ignores pointer events.
    <div className="fixed inset-x-0 bottom-8 z-50 pointer-events-none">
      <div className="max-w-[1360px] mx-auto px-7">
        <div
          role="dialog"
          aria-label="Cookie consent"
          className="pointer-events-auto w-[19rem] max-w-full rounded-2xl border border-[#e7e7e1] bg-white p-4 animate-[consentIn_200ms_ease-out]"
        >
          <p className="text-[12px] leading-relaxed text-slate-600">
            We use a <span className="font-medium text-slate-700">Google Analytics</span> cookie to
            see how the site is used. Essential cookies (sign-in) are always on, and our Vercel
            analytics are cookieless.{' '}
            <Link href="/privacy" className="text-brand-500 underline underline-offset-2 hover:text-brand-400">
              Privacy details
            </Link>
            .
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setConsent('accepted')}
              className="flex-1 rounded-lg bg-brand-500 py-1.5 text-[12px] font-medium text-black hover:bg-brand-400"
            >
              Accept
            </button>
            <button
              onClick={() => setConsent('declined')}
              className="flex-1 rounded-lg border border-[#e7e7e1] py-1.5 text-[12px] text-slate-600 hover:border-[#c8c8c0]"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
