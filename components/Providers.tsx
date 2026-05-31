'use client'

import { AuthProvider, useAuth } from '@/lib/auth-context'
import AuthModal from './AuthModal'

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
