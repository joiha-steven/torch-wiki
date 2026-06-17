'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { trackEvent, AnalyticsEvent } from './analytics'

type AuthContextType = {
  user: User | null
  loading: boolean
  nickname: string | null
  isAdmin: boolean
  isModerator: boolean
  wishlistIds: Set<string>
  collectionIds: Set<string>
  toggleWishlist: (flashlightId: string) => Promise<void>
  toggleCollection: (flashlightId: string) => Promise<void>
  signOut: () => Promise<void>
  openAuthModal: () => void
  authModalOpen: boolean
  closeAuthModal: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  nickname: null,
  isAdmin: false,
  isModerator: false,
  wishlistIds: new Set(),
  collectionIds: new Set(),
  toggleWishlist: async () => {},
  toggleCollection: async () => {},
  signOut: async () => {},
  openAuthModal: () => {},
  authModalOpen: false,
  closeAuthModal: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [nickname, setNickname] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isModerator, setIsModerator] = useState(false)
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())
  const [collectionIds, setCollectionIds] = useState<Set<string>>(new Set())
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const fetchedForUser = useRef<string | null>(null)

  const fetchLists = useCallback(async (userId: string) => {
    if (fetchedForUser.current === userId) return
    fetchedForUser.current = userId
    const [wRes, cRes, pRes] = await Promise.all([
      supabase.from('user_wishlists').select('flashlight_id').eq('user_id', userId),
      supabase.from('user_collections').select('flashlight_id').eq('user_id', userId),
      supabase.from('profiles').select('nickname, is_admin, is_moderator').eq('id', userId).maybeSingle(),
    ])
    setWishlistIds(new Set(wRes.data?.map((r) => r.flashlight_id) ?? []))
    setCollectionIds(new Set(cRes.data?.map((r) => r.flashlight_id) ?? []))

    let profile = pRes.data
    // First sign-in after sign-up: if there's no profile row yet but the user
    // picked a username at sign-up (stored in auth metadata), create the profile
    // with that nickname. If the name was taken meanwhile the upsert errors on the
    // unique constraint and we just leave it unset (they can pick one in Account).
    if (!profile) {
      const { data: { user } } = await supabase.auth.getUser()
      const wanted = (user?.user_metadata?.username as string | undefined)?.trim()
      if (wanted) {
        const { data: created } = await supabase
          .from('profiles')
          .upsert({ id: userId, nickname: wanted, updated_at: new Date().toISOString() })
          .select('nickname, is_admin, is_moderator')
          .single()
        if (created) profile = created
      }
    }
    setNickname(profile?.nickname ?? null)
    setIsAdmin(profile?.is_admin ?? false)
    setIsModerator(profile?.is_moderator ?? false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchLists(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchLists(session.user.id)
      } else {
        fetchedForUser.current = null
        setNickname(null)
        setIsAdmin(false)
        setIsModerator(false)
        setWishlistIds(new Set())
        setCollectionIds(new Set())
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchLists])

  const toggleWishlist = useCallback(async (flashlightId: string) => {
    if (!user) { setAuthModalOpen(true); return }
    const isIn = wishlistIds.has(flashlightId)
    setWishlistIds((prev) => {
      const next = new Set(prev)
      isIn ? next.delete(flashlightId) : next.add(flashlightId)
      return next
    })
    if (isIn) {
      await supabase.from('user_wishlists').delete().eq('user_id', user.id).eq('flashlight_id', flashlightId)
    } else {
      await supabase.from('user_wishlists').insert({ user_id: user.id, flashlight_id: flashlightId })
      trackEvent(AnalyticsEvent.WishlistAdd)
    }
  }, [user, wishlistIds])

  const toggleCollection = useCallback(async (flashlightId: string) => {
    if (!user) { setAuthModalOpen(true); return }
    const isIn = collectionIds.has(flashlightId)
    setCollectionIds((prev) => {
      const next = new Set(prev)
      isIn ? next.delete(flashlightId) : next.add(flashlightId)
      return next
    })
    if (isIn) {
      await supabase.from('user_collections').delete().eq('user_id', user.id).eq('flashlight_id', flashlightId)
    } else {
      await supabase.from('user_collections').insert({ user_id: user.id, flashlight_id: flashlightId })
      trackEvent(AnalyticsEvent.CollectionAdd)
    }
  }, [user, collectionIds])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return (
    <AuthContext.Provider value={{
      user, loading, nickname, isAdmin, isModerator, wishlistIds, collectionIds,
      toggleWishlist, toggleCollection, signOut,
      openAuthModal: () => setAuthModalOpen(true),
      authModalOpen,
      closeAuthModal: () => setAuthModalOpen(false),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
