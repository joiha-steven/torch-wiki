import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Report an issue',
  description: 'Report incorrect data, a missing flashlight, a broken image or a site bug on torch.EDC.wiki.',
  alternates: { canonical: 'https://torch.edc.wiki/report' },
  openGraph: {
    title: 'Report an issue — torch.EDC.wiki',
    description: 'Report incorrect data, a missing flashlight or a site bug on torch.EDC.wiki.',
    url: 'https://torch.edc.wiki/report',
    siteName: 'torch.EDC.wiki',
    type: 'website',
    images: ['/og-default.jpg'],
  },
}

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return children
}
