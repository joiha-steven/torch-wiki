import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo'
import DataLogView from '../DataLogView'

export const metadata: Metadata = {
  title: 'Database updates',
  description: 'A log of every data change on torch.EDC.wiki - flashlights and brands added or edited by the community.',
  alternates: { canonical: `${SITE_URL}/data-log` },
}

// Older pages: ISR like page 1. params (not searchParams) keeps it cacheable;
// dynamicParams stays true so any page number is rendered on demand then cached.
export const revalidate = 300

type Props = { params: Promise<{ page: string }> }

export default async function DataLogPaged({ params }: Props) {
  const { page: raw } = await params
  const page = parseInt(raw, 10)
  // Page 1 lives at /data-log; reject non-numeric / <2 so they don't duplicate it.
  if (!Number.isInteger(page) || page < 2) notFound()
  return <DataLogView page={page} />
}
