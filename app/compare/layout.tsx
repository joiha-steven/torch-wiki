import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compare flashlights',
  description: 'Compare flashlight specs side by side on torch.EDC.wiki — lumens, throw, battery, size and price for up to four lights at once.',
  alternates: { canonical: 'https://torch.edc.wiki/compare' },
  openGraph: {
    title: 'Compare flashlights — torch.EDC.wiki',
    description: 'Compare flashlight specs side by side — lumens, throw, battery, size and price.',
    url: 'https://torch.edc.wiki/compare',
    siteName: 'torch.EDC.wiki',
    type: 'website',
    images: ['/og-default.jpg'],
  },
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children
}
