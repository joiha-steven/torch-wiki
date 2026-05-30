import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Torch Wiki — Flashlight Database',
  description: 'Comprehensive flashlight database with specs, reviews, and comparison tools.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8f8f6] flex flex-col">
        <div className="flex-1">{children}</div>
      </body>
    </html>
  )
}
