import { X, Loader2, Plus } from 'lucide-react'
import { Field, input, ReviewRow } from './shared'

type Props = {
  rows: ReviewRow[]
  updateReview: (i: number, patch: Partial<ReviewRow>) => void
  addReviewRow: () => void
  removeReviewRow: (i: number) => void
  fetchReviewMeta: (i: number) => void
}

export default function ReviewsSection({ rows, updateReview, addReviewRow, removeReviewRow, fetchReviewMeta }: Props) {
  return (
    <Field label="Reviews">
      <p className="text-xs text-ink-3 mb-2">Paste a review link - the title and post date are filled in automatically (you can edit them). Add as many as you like.</p>
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="border border-line rounded-lg p-3 space-y-2 bg-slate-50 dark:bg-white/[0.04]/50">
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={r.url}
                onChange={e => updateReview(i, { url: e.target.value })}
                onBlur={() => { if (r.url.trim() && !r.title.trim()) fetchReviewMeta(i) }}
                placeholder="https://…  (review article or video URL)"
                className={input + ' flex-1'}
              />
              <button type="button" onClick={() => fetchReviewMeta(i)} disabled={r.fetching || !r.url.trim()}
                className="h-10 px-3 shrink-0 text-xs font-medium border border-line rounded-lg text-ink-2 hover:bg-panel disabled:opacity-50 flex items-center gap-1.5">
                {r.fetching ? <Loader2 size={13} className="animate-spin" /> : null}
                {r.fetching ? 'Fetching' : 'Fetch'}
              </button>
              <button type="button" onClick={() => removeReviewRow(i)} className="text-ink-3 hover:text-red-500 shrink-0">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
              <input
                type="text"
                value={r.title}
                onChange={e => updateReview(i, { title: e.target.value })}
                placeholder="Title (auto-filled)"
                className={input}
              />
              <input
                type="date"
                value={r.published_at ? r.published_at.slice(0, 10) : ''}
                onChange={e => updateReview(i, { published_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className={input + ' sm:w-44'}
              />
            </div>
          </div>
        ))}
        <button type="button" onClick={addReviewRow}
          className="flex items-center gap-2 px-3 py-2 border border-dashed border-line-strong rounded-lg text-sm text-ink-3 hover:border-brand-400 hover:text-brand-600 transition-colors">
          <Plus size={14} /> Add review link
        </button>
      </div>
    </Field>
  )
}
