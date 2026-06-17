import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'
import DataLogView from './DataLogView'

export const metadata: Metadata = {
  title: 'Database updates',
  description: 'A log of every data change on torch.EDC.wiki - flashlights and brands added or edited by the community.',
  alternates: { canonical: `${SITE_URL}/data-log` },
}

// Page 1 is the hot path - edge-cache it (ISR 5 min). The data only changes when
// a submission is approved, which calls revalidatePath('/data-log'). Paginating
// via the /data-log/[page] segment (not searchParams) is what keeps this static.
export const revalidate = 300

export default function DataLogPage() {
  return <DataLogView page={1} />
}
