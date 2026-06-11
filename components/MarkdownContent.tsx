import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

// Return an embeddable player URL for YouTube / Vimeo links, else null.
// Whitelisted domains only — we never render arbitrary iframes.
function videoEmbed(raw: string): string | null {
  let url: URL
  try { url = new URL(raw.trim()) } catch { return null }
  const host = url.hostname.replace(/^www\./, '')

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1)
    return id ? `https://www.youtube.com/embed/${id}` : null
  }
  if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (url.pathname === '/watch') {
      const id = url.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (url.pathname.startsWith('/embed/')) return `https://www.youtube.com${url.pathname}`
    if (url.pathname.startsWith('/shorts/')) return `https://www.youtube.com/embed/${url.pathname.split('/')[2]}`
  }
  if (host === 'vimeo.com') {
    const id = url.pathname.split('/').filter(Boolean)[0]
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null
  }
  return null
}

function VideoEmbed({ src }: { src: string }) {
  return (
    <span className="block my-4 rounded-xl overflow-hidden border border-[#e7e7e1] bg-black aspect-video">
      <iframe
        src={src}
        title="Embedded video"
        className="w-full h-full"
        allow="accelerator; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </span>
  )
}

const components: Components = {
  // A paragraph that contains nothing but a YouTube/Vimeo URL becomes an embed.
  p: ({ node, children }) => {
    const kids = node?.children ?? []
    if (kids.length === 1) {
      const only = kids[0]
      let url: string | null = null
      if (only.type === 'text') url = only.value
      else if (only.type === 'element' && only.tagName === 'a') url = String(only.properties?.href ?? '')
      const embed = url ? videoEmbed(url) : null
      if (embed) return <VideoEmbed src={embed} />
    }
    return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
  },
  h1:     ({ children }) => <h1 className="text-lg font-bold text-slate-900 mt-6 mb-2 first:mt-0">{children}</h1>,
  h2:     ({ children }) => <h2 className="text-base font-bold text-slate-900 mt-5 mb-2 first:mt-0">{children}</h2>,
  h3:     ({ children }) => <h3 className="text-sm font-semibold text-slate-800 mt-4 mb-1.5 first:mt-0">{children}</h3>,
  ul:     ({ children }) => <ul className="list-disc list-outside pl-5 space-y-1 mb-3">{children}</ul>,
  ol:     ({ children }) => <ol className="list-decimal list-outside pl-5 space-y-1 mb-3">{children}</ol>,
  li:     ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
  em:     ({ children }) => <em className="italic">{children}</em>,
  del:    ({ children }) => <del className="text-slate-400">{children}</del>,
  a:      ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
      {children}
    </a>
  ),
  img:    ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof src === 'string' ? src : ''}
      alt={alt ?? ''}
      loading="lazy"
      className="block my-4 max-w-full h-auto rounded-xl border border-[#e7e7e1] bg-white"
    />
  ),
  code:   ({ children }) => (
    <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[0.85em] font-mono">{children}</code>
  ),
  pre:    ({ children }) => (
    <pre className="bg-slate-50 border border-[#e7e7e1] rounded-lg p-3 overflow-x-auto text-xs font-mono my-3">{children}</pre>
  ),
  hr:     () => <hr className="border-[#e7e7e1] my-5" />,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-brand-400 pl-4 text-slate-500 italic my-4">{children}</blockquote>
  ),
  table:  ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full text-left border-collapse text-[0.95em]">{children}</table>
    </div>
  ),
  thead:  ({ children }) => <thead className="border-b border-[#d3d3cb]">{children}</thead>,
  th:     ({ children }) => <th className="py-2 pr-4 font-semibold text-slate-800">{children}</th>,
  td:     ({ children }) => <td className="py-2 pr-4 border-t border-[#e7e7e1] align-top">{children}</td>,
}

export default function MarkdownContent({
  children,
  className = 'text-sm text-slate-600',
}: {
  children: string
  className?: string
}) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{children}</ReactMarkdown>
    </div>
  )
}
