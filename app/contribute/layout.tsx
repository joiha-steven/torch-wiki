import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contribute',
  description: 'Add a new flashlight or improve existing data on torch.EDC.wiki — a community-maintained flashlight database.',
  alternates: { canonical: 'https://torch.edc.wiki/contribute' },
  openGraph: {
    title: 'Contribute — torch.EDC.wiki',
    description: 'Add a new flashlight or improve existing data on torch.EDC.wiki.',
    url: 'https://torch.edc.wiki/contribute',
    siteName: 'torch.EDC.wiki',
    type: 'website',
    images: ['/og-default.jpg'],
  },
}

export default function ContributeLayout({ children }: { children: React.ReactNode }) {
  return children
}
