'use client'

import { useEffect } from 'react'
import ErrorState from '@/components/ErrorState'

export default function FlashlightError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ErrorState
      reset={reset}
      title="Couldn’t load this flashlight"
      message="Something went wrong fetching this page. Try again, or go back to browsing."
    />
  )
}
