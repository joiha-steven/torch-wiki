'use client'

import { useEffect } from 'react'
import ErrorState from '@/components/ErrorState'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface the error for debugging; details aren't shown to the user.
    console.error(error)
  }, [error])

  return <ErrorState reset={reset} />
}
