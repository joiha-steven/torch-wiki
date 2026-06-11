import type { Metadata } from 'next'
import { SITE_URL, OG_IMAGE } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Compare flashlights',
  description: 'Compare flashlight specs side by side on torch.EDC.wiki — lumens, throw, battery, size and price for up to four lights at once.',
  alternates: { canonical: `${SITE_URL}/compare` },
  openGraph: {
    title: 'Compare flashlights — torch.EDC.wiki',
    description: 'Compare flashlight specs side by side — lumens, throw, battery, size and price.',
    url: `${SITE_URL}/compare`,
    siteName: 'torch.EDC.wiki',
    type: 'website',
    images: [OG_IMAGE],
  },
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children
}
