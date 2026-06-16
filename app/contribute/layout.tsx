import type { Metadata } from 'next'
import { SITE_URL, OG_IMAGE } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Contribute',
  description: 'Add a new flashlight or improve existing data on torch.EDC.wiki - a community-maintained flashlight database.',
  alternates: { canonical: `${SITE_URL}/contribute` },
  openGraph: {
    title: 'Contribute - torch.EDC.wiki',
    description: 'Add a new flashlight or improve existing data on torch.EDC.wiki.',
    url: `${SITE_URL}/contribute`,
    siteName: 'torch.EDC.wiki',
    type: 'website',
    images: [OG_IMAGE],
  },
}

export default function ContributeLayout({ children }: { children: React.ReactNode }) {
  return children
}
