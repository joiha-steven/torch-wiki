import { Loader2 } from 'lucide-react'

type Props = {
  isAdmin: boolean
  mode: 'new' | 'edit'
  submitting: boolean
  captchaToken: string | null
  onCancel: () => void
}

export default function FormFooter({ isAdmin, mode, submitting, captchaToken, onCancel }: Props) {
  return (
    <>
      <p className="text-[11px] text-ink-3 leading-relaxed">
        By submitting, you agree your contribution is factual data from legitimate sources, and any original text you write is licensed under{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink-2">CC BY 4.0</a>.
      </p>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 text-sm text-ink-2 border border-line rounded-lg py-2.5 hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/5">
          Cancel
        </button>
        <button type="submit" disabled={submitting || (!isAdmin && !captchaToken)}
          className="flex-1 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-black text-sm font-medium rounded-lg py-2.5 flex items-center justify-center gap-2">
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitting
            ? (isAdmin ? 'Saving…' : 'Submitting…')
            : isAdmin
              ? (mode === 'new' ? 'Add flashlight' : 'Save changes')
              : (mode === 'new' ? 'Submit for review' : 'Submit edit')}
        </button>
      </div>
    </>
  )
}
