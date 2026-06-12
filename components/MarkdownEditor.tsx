'use client'

import { useState, useRef } from 'react'
import { upload } from '@vercel/blob/client'
import { Bold, Italic, Heading2, List, Link2, ImagePlus, Video, Loader2 } from 'lucide-react'
import MarkdownContent from '@/components/MarkdownContent'
import { supabase } from '@/lib/supabase'

function ToolbarButton({ onClick, title, disabled, children }: { onClick: () => void; title: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="w-7 h-7 grid place-items-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 transition-colors"
    >
      {children}
    </button>
  )
}

type Props = {
  value: string
  onChange: (v: string) => void
  label?: string
  placeholder?: string
  uploadPrefix?: string  // Vercel Blob folder for inline images
}

export default function MarkdownEditor({ value, onChange, label = 'Description', placeholder, uploadPrefix = 'submissions/inline' }: Props) {
  const [preview, setPreview] = useState(false)
  const [uploading, setUploading] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Wrap the current selection with markers (e.g. ** **), or insert a placeholder.
  function wrap(before: string, after = before, ph = '') {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart, end = ta.selectionEnd
    const sel = value.slice(start, end) || ph
    onChange(value.slice(0, start) + before + sel + after + value.slice(end))
    requestAnimationFrame(() => {
      ta.focus()
      const p = start + before.length
      ta.setSelectionRange(p, p + sel.length)
    })
  }

  // Prefix the current line (e.g. "## ", "- ").
  function linePrefix(prefix: string) {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    onChange(value.slice(0, lineStart) + prefix + value.slice(lineStart))
    requestAnimationFrame(() => { ta.focus(); const p = start + prefix.length; ta.setSelectionRange(p, p) })
  }

  // Insert a block on its own line, padded with blank lines.
  function insertBlock(text: string) {
    const ta = taRef.current
    const start = ta?.selectionStart ?? value.length
    const end = ta?.selectionEnd ?? value.length
    const before = value.slice(0, start)
    const after = value.slice(end)
    const pre = before === '' ? '' : before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'
    const post = after === '' ? '' : after.startsWith('\n') ? '' : '\n\n'
    onChange(before + pre + text + post + after)
    requestAnimationFrame(() => {
      if (!ta) return
      ta.focus()
      const p = (before + pre + text).length
      ta.setSelectionRange(p, p)
    })
  }

  function insertLink() {
    const url = window.prompt('Link URL (https://…)')
    if (url) wrap('[', `](${url})`, 'link text')
  }

  function insertVideo() {
    const url = window.prompt('YouTube or Vimeo URL')
    if (url) insertBlock(url.trim())
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const { data: { session } } = await supabase.auth.getSession()
      const blob = await upload(`${uploadPrefix}/${crypto.randomUUID()}.${ext}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        clientPayload: JSON.stringify({ session: session?.access_token ?? '' }),
      })
      insertBlock(`![](${blob.url})`)
    } catch (err) {
      alert('Image upload failed: ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-slate-600">{label}</label>
        <div className="flex text-xs rounded-md overflow-hidden border border-slate-200">
          <button type="button" onClick={() => setPreview(false)}
            className={`px-2.5 py-0.5 transition-colors ${!preview ? 'bg-[#17171a] text-white' : 'text-[#6c6c66] hover:text-[#17171a]'}`}>Write</button>
          <button type="button" onClick={() => setPreview(true)}
            className={`px-2.5 py-0.5 transition-colors ${preview ? 'bg-[#17171a] text-white' : 'text-[#6c6c66] hover:text-[#17171a]'}`}>Preview</button>
        </div>
      </div>

      {preview ? (
        <div className="min-h-[140px] text-sm border border-slate-200 rounded-lg px-3.5 py-3 bg-white">
          {value
            ? <MarkdownContent>{value}</MarkdownContent>
            : <span className="text-slate-300">Nothing to preview</span>}
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden focus-within:ring-2 focus-within:ring-brand-300">
          <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-slate-100">
            <ToolbarButton onClick={() => wrap('**', '**', 'bold text')} title="Bold"><Bold size={15} /></ToolbarButton>
            <ToolbarButton onClick={() => wrap('_', '_', 'italic text')} title="Italic"><Italic size={15} /></ToolbarButton>
            <ToolbarButton onClick={() => linePrefix('## ')} title="Heading"><Heading2 size={15} /></ToolbarButton>
            <ToolbarButton onClick={() => linePrefix('- ')} title="List"><List size={15} /></ToolbarButton>
            <ToolbarButton onClick={insertLink} title="Link"><Link2 size={15} /></ToolbarButton>
            <span className="w-px h-4 bg-slate-200 mx-1" />
            <ToolbarButton onClick={() => fileRef.current?.click()} title="Insert image" disabled={uploading}>
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
            </ToolbarButton>
            <ToolbarButton onClick={insertVideo} title="Embed video (YouTube / Vimeo)"><Video size={15} /></ToolbarButton>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} className="hidden" />
          </div>
          <textarea
            ref={taRef}
            className="w-full text-sm px-3.5 py-2.5 resize-y bg-transparent focus:outline-none min-h-[120px]"
            rows={6}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder ?? 'Markdown supported — **bold**, _italic_, ## headings, - lists, links. Use the toolbar to upload an image or embed a YouTube/Vimeo video.'}
          />
        </div>
      )}
    </div>
  )
}
