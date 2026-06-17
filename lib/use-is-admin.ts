'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

export function useIsAdmin() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Reset on sign-out is an intentional post-render sync (user comes from context,
    // not derivable at render time) - the cascading-render hint doesn't apply.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!user) { setIsAdmin(false); return }
    // Admin/mod is derived from the profiles table — the bootstrap ADMIN_EMAIL
    // check lives server-side only so the admin's email never ships in client JS.
    supabase
      .from('profiles')
      .select('is_admin, is_moderator')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setIsAdmin(!!(data?.is_admin || data?.is_moderator)))
  }, [user])

  return isAdmin
}
