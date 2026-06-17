'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { UpdateEntry } from './updates-data'

type Feature = { title: string; body: string }
type Stack = { name: string; note: string }

// Tabbed Log: "About" (features + stack as cards) vs "Changelog" (full-width
// accordion, one day open at a time, newest open by default). Keeps the page to
// roughly one screen instead of an endless single column.
export default function LogTabs({ features, stack, updates }: {
  features: Feature[]; stack: Stack[]; updates: UpdateEntry[]
}) {
  const [tab, setTab] = useState<'about' | 'changelog'>('changelog')
  const [open, setOpen] = useState(0) // expanded day index; -1 = all collapsed

  return (
    <div>
      <div className="flex justify-center mb-10">
        <div className="inline-flex p-1 bg-panel border border-line rounded-full">
          {(['about', 'changelog'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-1.5 text-sm font-medium rounded-full transition-colors ${
                tab === t ? 'bg-brand-500 text-black' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {t === 'about' ? 'About' : 'Changelog'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'about' ? (
        <div className="space-y-12">
          <section>
            <h2 className="text-lg font-bold text-ink mb-5">Features</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map(f => (
                <div key={f.title} className="bg-panel border border-line rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-ink">{f.title}</h3>
                  <p className="text-[13px] text-ink-3 leading-relaxed mt-1.5">{f.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink mb-5">Built with</h2>
            <div className="bg-panel border border-line rounded-2xl p-6 sm:p-7 space-y-3">
              {stack.map(s => (
                <div key={s.name} className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
                  <span className="text-sm font-semibold text-ink shrink-0 sm:w-56">{s.name}</span>
                  <span className="text-[13px] text-ink-3 leading-relaxed">{s.note}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <section className="max-w-3xl mx-auto space-y-3">
          {updates.map((u, i) => {
            const isOpen = open === i
            return (
              <div key={i} className="bg-panel border border-line rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-3 px-5 sm:px-6 py-4 text-left hover:bg-line/40 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h3 className="font-semibold text-ink">{u.title}</h3>
                      {u.version && (
                        <span className="text-xs text-brand-600 font-medium bg-brand-50 px-2 py-0.5 rounded">{u.version}</span>
                      )}
                    </div>
                    <p className="text-xs text-ink-3 mt-0.5">{u.date}</p>
                  </div>
                  <span className="text-xs text-ink-3 shrink-0 tabular-nums">{u.items.length}</span>
                  <ChevronDown size={16} className={`text-ink-3 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <ul className="px-5 sm:px-6 pb-5 pt-4 space-y-1.5 border-t border-line">
                    {u.items.map((item, j) => (
                      <li key={j} className="text-sm text-ink-2 flex gap-2">
                        <span className="text-slate-300 shrink-0 mt-0.5">–</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
