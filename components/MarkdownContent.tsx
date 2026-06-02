import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'

const components: Components = {
  p:      ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
  h1:     ({ children }) => <h1 className="text-base font-bold text-slate-900 mt-5 mb-2 first:mt-0">{children}</h1>,
  h2:     ({ children }) => <h2 className="text-sm font-bold text-slate-900 mt-4 mb-1.5 first:mt-0">{children}</h2>,
  h3:     ({ children }) => <h3 className="text-sm font-semibold text-slate-800 mt-3 mb-1 first:mt-0">{children}</h3>,
  ul:     ({ children }) => <ul className="list-disc list-outside pl-4 space-y-0.5 mb-3">{children}</ul>,
  ol:     ({ children }) => <ol className="list-decimal list-outside pl-4 space-y-0.5 mb-3">{children}</ol>,
  li:     ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
  em:     ({ children }) => <em className="italic">{children}</em>,
  a:      ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
      {children}
    </a>
  ),
  code:   ({ children }) => (
    <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
  ),
  hr:     () => <hr className="border-slate-200 my-3" />,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-slate-300 pl-3 text-slate-500 italic my-3">{children}</blockquote>
  ),
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
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  )
}
