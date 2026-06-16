import type { Metadata } from 'next'
import { SITE_URL, OG_IMAGE } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Report an issue',
  description: 'Report incorrect data, a missing flashlight, a broken image or a site bug on torch.EDC.wiki.',
  alternates: { canonical: `${SITE_URL}/report` },
  openGraph: {
    title: 'Report an issue - torch.EDC.wiki',
    description: 'Report incorrect data, a missing flashlight or a site bug on torch.EDC.wiki.',
    url: `${SITE_URL}/report`,
    siteName: 'torch.EDC.wiki',
    type: 'website',
    images: [OG_IMAGE],
  },
}

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return children
}
