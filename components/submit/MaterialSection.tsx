import { X, Plus } from 'lucide-react'
import type { MaterialEntry } from '@/lib/types'
import {
  MATERIALS, FINISHES, COLORS, DAMASTEEL, DAMASTEEL_STATES,
  defaultFinish, defaultColor, showsColor,
} from '@/lib/materials'

type Props = {
  rows: MaterialEntry[]
  onChange: (rows: MaterialEntry[]) => void
}

const ctrl = 'h-10 text-sm border border-line rounded-lg bg-panel px-3 focus:outline-none focus:ring-2 focus:ring-brand-300'

// Up to 3 materials, each Material ▸ Finish ▸ (Colour / etch state). Finish list
// follows the chosen material; the colour slot only shows for colour-bearing
// finishes (Anodized/Cerakote/PVD/Powder/Painted/Molded), defaulting to Black -
// or, for Damasteel, an Unetched/Etched state. Self-managed: emits the full array.
export default function MaterialSection({ rows, onChange }: Props) {
  const update = (i: number, patch: Partial<MaterialEntry>) =>
    onChange(rows.map((r, j) => j === i ? { ...r, ...patch } : r))

  const setMaterial = (i: number, material: string) => {
    const finish = material ? defaultFinish(material) : null
    const color = showsColor(material, finish) ? defaultColor(material) : null
    update(i, { material, finish, color })
  }

  const setFinish = (i: number, material: string, finish: string) => {
    const color = showsColor(material, finish) ? defaultColor(material) : null
    update(i, { finish, color })
  }

  const addRow = () => onChange(rows.length >= 3 ? rows : [...rows, { material: '', finish: null, color: null }])
  const removeRow = (i: number) => onChange(rows.filter((_, j) => j !== i))

  return (
    <div>
      <p className="text-[13px] font-semibold text-ink-2 mb-1">Materials</p>
      <p className="text-xs text-ink-3 mb-2">Up to 3 - e.g. an aluminium body with a titanium bezel. Pick the material, then its finish; a colour appears for finishes that have one.</p>
      <div className="space-y-2">
        {rows.map((row, i) => {
          const finishes = FINISHES[row.material] ?? []
          const colorVisible = showsColor(row.material, row.finish)
          const isDama = row.material === DAMASTEEL
          return (
            <div key={i} className="flex items-center gap-2">
              <select aria-label="Material" className={`${ctrl} flex-1 min-w-0`}
                value={row.material} onChange={e => setMaterial(i, e.target.value)}>
                <option value="">- Material -</option>
                {MATERIALS.map(m => <option key={m}>{m}</option>)}
              </select>

              <select aria-label="Finish" className={`${ctrl} flex-1 min-w-0 disabled:opacity-40`}
                value={row.finish ?? ''} disabled={!row.material}
                onChange={e => setFinish(i, row.material, e.target.value)}>
                <option value="">- Finish -</option>
                {finishes.map(f => <option key={f}>{f}</option>)}
              </select>

              {colorVisible ? (
                <select aria-label={isDama ? 'Etch state' : 'Colour'} className={`${ctrl} flex-1 min-w-0`}
                  value={row.color ?? ''} onChange={e => update(i, { color: e.target.value || null })}>
                  {(isDama ? DAMASTEEL_STATES : COLORS).map(c => <option key={c}>{c}</option>)}
                </select>
              ) : (
                <div className="flex-1 min-w-0" aria-hidden />
              )}

              {rows.length > 1 && (
                <button type="button" onClick={() => removeRow(i)} aria-label="Remove material"
                  className="text-ink-3 hover:text-red-400 shrink-0"><X size={15} /></button>
              )}
            </div>
          )
        })}
      </div>
      {rows.length < 3 && (
        <button type="button" onClick={addRow}
          className="mt-2 inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700">
          <Plus size={13} /> Add material
        </button>
      )}
    </div>
  )
}
