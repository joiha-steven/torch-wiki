import BrowsePage from '@/components/BrowsePage'
import { Flashlight } from '@/lib/types'
import { DEFAULT_FILTERS, PAGE_SIZE_DESKTOP, buildQuery, fetchBrowseMeta } from '@/lib/browse'

// Server-render the first batch + filter meta next to the DB (iad1, same region
// as Supabase) so the browse grid arrives in the HTML instead of waiting for the
// client to boot and fetch across the network. Revalidated hourly (ISR); the
// nightly sort_seed reshuffle is well within that window.
export const revalidate = 3600

export default async function Home() {
  const [initial, meta] = await Promise.all([
    buildQuery(DEFAULT_FILTERS, 0, PAGE_SIZE_DESKTOP - 1, null),
    fetchBrowseMeta(),
  ])

  return (
    <BrowsePage
      initialItems={(initial.data ?? []) as Flashlight[]}
      initialCount={initial.count ?? 0}
      initialMeta={meta}
    />
  )
}
