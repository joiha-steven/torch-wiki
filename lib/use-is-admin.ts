'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

export function useIsAdmin() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!user) { setIsAdmin(false); return }
    if (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) { setIsAdmin(true); return }
    supabase
      .from('profiles')
      .select('is_admin, is_moderator')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setIsAdmin(!!(data?.is_admin || data?.is_moderator)))
  }, [user])

  return isAdmin
}
