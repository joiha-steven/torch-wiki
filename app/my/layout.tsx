import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Lists',
  robots: { index: false, follow: false },
}

export default function MyLayout({ children }: { children: React.ReactNode }) {
  return children
}
