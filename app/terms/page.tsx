import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, OG_IMAGE } from '@/lib/seo'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms of Use for torch.EDC.wiki - a free, non-commercial flashlight reference project.',
  alternates: { canonical: `${SITE_URL}/terms` },
  openGraph: {
    title: 'Terms of Use - torch.EDC.wiki',
    description: 'The terms for using and contributing to torch.EDC.wiki.',
    url: `${SITE_URL}/terms`,
    siteName: 'torch.EDC.wiki',
    type: 'website',
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pt-6 mt-6 border-t border-line first:pt-0 first:mt-0 first:border-0">
      <h2 className="font-semibold text-ink mb-2">{title}</h2>
      <div className="space-y-2 text-[13px] leading-relaxed text-[#4c4c47] dark:text-ink-2">{children}</div>
    </section>
  )
}

const link = 'text-brand-500 underline underline-offset-2 hover:text-brand-400'

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-[1280px] mx-auto px-7 py-8">
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-bold text-ink tracking-[-0.02em]">Terms of Use</h1>
          <p className="mt-2 text-[13px] text-ink-2">
            torch.EDC.wiki is a free, non-commercial flashlight reference project, not affiliated with or endorsed by any manufacturer or brand.
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-panel border border-line rounded-2xl p-6 sm:p-8">
          <Section title="Accepting these terms">
            <p>
              By browsing the site, creating an account, or contributing, you agree to these Terms and to our{' '}
              <Link href="/privacy" className={link}>Privacy &amp; Cookies</Link> policy. If you don&apos;t agree, please don&apos;t use the site.
            </p>
          </Section>

          <Section title="Who can use it">
            <p>
              Browsing and searching are open to everyone, no account needed. A free account lets you save a wishlist and
              collection and contribute to the catalog. You&apos;re responsible for keeping your password and recovery codes
              safe and for activity under your account. Please use accurate sign-up details and one account per person.
            </p>
          </Section>

          <Section title="Community rules">
            <p>When you submit, edit, or report content, you agree to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium text-ink-2">Accuracy</span> — only add specs you can verify (manufacturer, manual, or a reliable review). Don&apos;t guess or pad numbers; leave a field blank if you&apos;re unsure.</li>
              <li><span className="font-medium text-ink-2">No promotion</span> — no advertising, affiliate links, referral codes or self-promotion; don&apos;t submit duplicates or open junk reports.</li>
              <li><span className="font-medium text-ink-2">Respect image ownership</span> — only upload images you have the right to use.</li>
              <li><span className="font-medium text-ink-2">Be civil and lawful</span> — no abusive, misleading, infringing or illegal content.</li>
            </ul>
          </Section>

          <Section title="Your contributions &amp; licensing">
            <p>
              Submissions go to a review queue. Moderators and admins may edit, approve, reject, or remove any contribution
              at their discretion to keep the catalog accurate and clean.
            </p>
            <p>
              By contributing, you agree that any original text you write and the data compilation you add are published under{' '}
              <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className={link}>CC BY 4.0</a>,
              and you confirm you have the right to submit what you post. Plain factual specifications are facts and belong to
              no one. Once published, content becomes part of the shared wiki.
            </p>
          </Section>

          <Section title="Intellectual property">
            <p>
              The site <span className="font-medium text-ink-2">code</span> is open source under the{' '}
              <a href="https://github.com/joiha-steven/torch-wiki/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className={link}>MIT</a> license.
              Original <span className="font-medium text-ink-2">content &amp; data compilation</span> are licensed{' '}
              <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className={link}>CC BY 4.0</a> — reuse freely with credit (see{' '}
              <a href="https://github.com/joiha-steven/torch-wiki/blob/main/LICENSE-CONTENT.md" target="_blank" rel="noopener noreferrer" className={link}>LICENSE-CONTENT.md</a>).
              <span className="font-medium text-ink-2"> Product images</span> belong to their respective manufacturers and are
              shown for non-commercial reference only — they are not covered by the licenses above. Brand names and trademarks
              belong to their owners.
            </p>
          </Section>

          <Section title="Notice &amp; takedown">
            <p>
              If you&apos;re a rights holder and want an image or other content removed, contact us via{' '}
              <a href="https://github.com/joiha-steven/torch-wiki" target="_blank" rel="noopener noreferrer" className={link}>GitHub</a>{' '}
              or the <Link href="/report" className={link}>Report</Link> page and we&apos;ll take it down promptly, no questions asked.
            </p>
          </Section>

          <Section title="Accounts &amp; moderation">
            <p>
              We may limit, suspend, or remove accounts that break these rules. You can delete your account at any time; see{' '}
              <Link href="/privacy" className={link}>Privacy</Link> for what data we hold.
            </p>
          </Section>

          <Section title="No warranty / accuracy">
            <p>
              The catalog is compiled from public sources and community contributions and is provided <span className="font-medium text-ink-2">&ldquo;as is.&rdquo;</span>{' '}
              Specifications may contain errors or be out of date — always verify with the manufacturer before making a purchase.
              We don&apos;t guarantee accuracy, completeness, or availability, and we&apos;re not responsible for decisions made based on the data.
            </p>
          </Section>

          <Section title="Limitation of liability">
            <p>
              torch.EDC.wiki is a non-commercial hobby project. To the maximum extent permitted by law, we are not liable for any
              damages arising from your use of the site or your reliance on its content.
            </p>
          </Section>

          <Section title="Changes to these terms">
            <p>
              We may update these Terms as the project evolves. Material changes will be noted on the site, and continuing to use
              the site after a change means you accept the updated Terms.
            </p>
            <p className="text-ink-3">Last updated: 18 June 2026.</p>
          </Section>
        </div>
      </div>
    </div>
  )
}
