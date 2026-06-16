import type { Metadata } from 'next'
import { SITE_URL, OG_IMAGE } from '@/lib/seo'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Privacy & Cookies',
  description: 'How torch.EDC.wiki uses cookies and handles data - a non-commercial reference project.',
  alternates: { canonical: `${SITE_URL}/privacy` },
  openGraph: {
    title: 'Privacy & Cookies - torch.EDC.wiki',
    description: 'How torch.EDC.wiki uses cookies and handles data.',
    url: `${SITE_URL}/privacy`,
    siteName: 'torch.EDC.wiki',
    type: 'website',
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pt-6 mt-6 border-t border-line first:pt-0 first:mt-0 first:border-0">
      <h2 className="font-semibold text-ink mb-2">{title}</h2>
      <div className="space-y-2 text-[13px] leading-relaxed text-[#4c4c47]">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-[1280px] mx-auto px-7 py-8">
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-bold text-ink tracking-[-0.02em]">Privacy &amp; Cookies</h1>
          <p className="mt-2 text-[13px] text-ink-2">torch.EDC.wiki is a non-commercial reference project, not affiliated with any brand.</p>
        </div>

        <div className="max-w-3xl mx-auto bg-panel border border-line rounded-2xl p-6 sm:p-8">
          <Section title="Cookies we use">
            <p>
              <span className="font-medium text-ink-2">Essential cookies</span> are always on:
              they keep you signed in (Supabase auth session) and protect our forms from spam
              (Cloudflare Turnstile). The site can&apos;t work without them, so they don&apos;t require consent.
            </p>
            <p>
              <span className="font-medium text-ink-2">Analytics cookies</span> are optional. We use
              Google Analytics to understand how the site is used; it sets a <code>_ga</code> cookie.
              It only loads <span className="font-medium text-ink-2">after you click Accept</span> on
              the cookie banner. Click Decline and no analytics cookie is ever set. You can change your
              mind by clearing site data in your browser.
            </p>
          </Section>

          <Section title="Cookieless analytics">
            <p>
              We also use Vercel Analytics and Speed Insights to measure traffic and performance.
              These are <span className="font-medium text-ink-2">cookieless</span> and don&apos;t track
              you across sites, so they run regardless of your cookie choice.
            </p>
          </Section>

          <Section title="Account data">
            <p>
              If you create an account, we store your email and (optionally) a public nickname and your
              wishlist/collection. We use this only to run your account and your contributions - we
              don&apos;t sell it or share it for advertising. You can delete your account at any time.
            </p>
          </Section>

          <Section title="Product images & content">
            <p>
              Product images belong to their respective manufacturers and are shown for non-commercial
              reference only. Our original content and data compilation are licensed under{' '}
              <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="text-brand-500 underline underline-offset-2 hover:text-brand-400">CC BY 4.0</a>;
              the code is{' '}
              <a href="https://github.com/joiha-steven/torch-wiki/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-brand-500 underline underline-offset-2 hover:text-brand-400">MIT</a>.
              See{' '}
              <a href="https://github.com/joiha-steven/torch-wiki/blob/main/LICENSE-CONTENT.md" target="_blank" rel="noopener noreferrer" className="text-brand-500 underline underline-offset-2 hover:text-brand-400">LICENSE-CONTENT.md</a>{' '}
              for the full breakdown.
            </p>
          </Section>

          <Section title="Notice &amp; takedown">
            <p>
              If you are a rights holder and want an image removed, contact us via{' '}
              <a href="https://github.com/joiha-steven/torch-wiki" target="_blank" rel="noopener noreferrer" className="text-brand-500 underline underline-offset-2 hover:text-brand-400">GitHub</a>{' '}
              and we&apos;ll take it down promptly, no questions asked.
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}
