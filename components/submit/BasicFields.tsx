import { Flashlight } from '@/lib/types'
import { Field, input, CATEGORIES } from './shared'

type Props = {
  data: Partial<Flashlight>
  set: (k: keyof Flashlight, v: unknown) => void
  num: (v: string) => number | null
}

export default function BasicFields({ data, set, num }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="Brand" required>
        <input className={input} value={data.brand ?? ''} onChange={e => set('brand', e.target.value)} placeholder="e.g. Surefire" />
      </Field>
      <Field label="Model" required>
        <input className={input} value={data.model ?? ''} onChange={e => set('model', e.target.value)} placeholder="e.g. M600DF Scout" />
      </Field>
      <Field label="Category">
        <select className={input} value={data.category ?? ''} onChange={e => set('category', e.target.value || null)}>
          <option value="">— Select —</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Year">
        <input className={input} type="number" value={data.year ?? ''} onChange={e => set('year', num(e.target.value))} placeholder="e.g. 2023" />
      </Field>
    </div>
  )
}
