'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2, Check } from 'lucide-react'
import { upload } from '@vercel/blob/client'
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile'
import Header from '@/components/Header'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!

const TOPICS = [
  'Wrong specs / incorrect data',
  'Missing flashlight',
  'Broken or wrong image',
  'Site bug / technical issue',
  'Suggestion',
  'Other',
]

const inp = 'w-full h-10 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white'

export default function ReportPage() {
  const { user } = useAuth()

  const [topic, setTopic]     = useState('')
  const [email, setEmail]     = useState('')
  const [body, setBody]       = useState('')
  const [file, setFile]       = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')

  const fileRef      = useRef<HTMLInputElement>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)

  function handleFile(f: File) {
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function removeFile() {
    setFile(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!topic) { setError('Please select a topic.'); return }
    if (!body.trim()) { setError('Please describe the issue.'); return }
    if (!user && !email) { setError('Please enter your email.'); return }
    if (!user && !captchaToken) { setError('Please complete the captcha.'); return }

    setError(''); setSubmitting(true)

    try {
      // Verify captcha for anonymous users
      if (!user) {
        const res = await fetch('/api/captcha-verify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: captchaToken }),
        })
        const data = await res.json()
        if (!data.success) {
          setError('Captcha failed — please try again.')
          turnstileRef.current?.reset(); setCaptchaToken(null)
          setSubmitting(false); return
        }
      }

      // Upload attachment if any
      let attachmentUrl: string | null = null
      if (file) {
        const ext = file.name.split('.').pop()
        const blob = await upload(`reports/${crypto.randomUUID()}.${ext}`, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        })
        attachmentUrl = blob.url
      }

      // Insert report
      const { error: dbErr } = await supabase.from('bug_reports').insert({
        user_id:        user?.id ?? null,
        email:          user ? null : email,
        topic,
        body:           body.trim(),
        attachment_url: attachmentUrl,
      })
      if (dbErr) throw dbErr

      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-[1280px] mx-auto px-7 py-8">

        <div className="text-center mb-10">
          <h1 className="text-[28px] font-bold text-[#17171a] tracking-[-0.02em]">Report an issue</h1>
          <p className="mt-2 text-[13px] text-[#6c6c66]">Spot a problem or have a suggestion? Let us know.</p>
        </div>

        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-[#e7e7e1] p-6 sm:p-7">
          {done ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check size={22} className="text-green-600" />
              </div>
              <p className="font-semibold text-slate-900">Report submitted</p>
              <p className="text-sm text-slate-500">Thanks — we&apos;ll look into it.</p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Anonymous email */}
                {!user && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Your email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className={inp} placeholder="so we can follow up if needed" required />
                  </div>
                )}

                {/* Topic */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Topic</label>
                  <select value={topic} onChange={e => setTopic(e.target.value)} className={inp} required>
                    <option value="">— Select a topic —</option>
                    {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Body */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                  <textarea value={body} onChange={e => setBody(e.target.value)} required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white resize-none"
                    rows={5} placeholder="Describe the issue in detail. Include the flashlight name or page URL if relevant." />
                </div>

                {/* Attachment */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Attachment <span className="text-slate-400 font-normal">(optional screenshot)</span></label>
                  {preview ? (
                    <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-slate-200 group">
                      <Image src={preview} alt="attachment" fill className="object-cover" />
                      <button type="button" onClick={removeFile}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden"
                        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-2 text-sm text-slate-500 border border-dashed border-slate-300 rounded-lg px-4 py-2.5 hover:border-brand-400 hover:text-brand-600 transition-colors">
                        <Upload size={14} /> Upload image
                      </button>
                    </>
                  )}
                </div>

                {/* Captcha for anonymous */}
                {!user && (
                  <Turnstile ref={turnstileRef} siteKey={SITE_KEY}
                    onSuccess={t => setCaptchaToken(t)} onExpire={() => setCaptchaToken(null)}
                    options={{ theme: 'light', size: 'flexible' }} />
                )}

                {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                <button type="submit" disabled={submitting || (!user && !captchaToken)}
                  className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-black text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2">
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {submitting ? 'Submitting…' : 'Submit report'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
