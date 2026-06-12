'use client'

import dynamic from 'next/dynamic'
import { AuthProvider, useAuth } from '@/lib/auth-context'

// The auth modal (and its Cloudflare Turnstile dependency) only mounts when the
// user opens it — keep it out of the initial bundle so it doesn't weigh on the
// browse-page first paint. Client-only: it's purely interactive, never SSR'd.
const AuthModal = dynamic(() => import('./AuthModal'), { ssr: false })

function AuthModalPortal() {
  const { authModalOpen } = useAuth()
  if (!authModalOpen) return null
  return <AuthModal />
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <AuthModalPortal />
    </AuthProvider>
  )
}
