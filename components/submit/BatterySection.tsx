import { BatteryOption } from '@/lib/types'
import { X, Plus } from 'lucide-react'
import { Field, input, BATTERY_TYPES, CHARGING_TYPES } from './shared'

type Props = {
  rows: BatteryOption[]
  updateRow: (i: number, patch: Partial<BatteryOption>) => void
  addRow: () => void
  removeRow: (i: number) => void
  chargingType: string | null
  onChargingChange: (v: string | null) => void
}

export default function BatterySection({ rows, updateRow, addRow, removeRow, chargingType, onChargingChange }: Props) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-ink-2 mb-3">Battery & Charging</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-ink-3 mb-1">Battery options</label>
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="number" min={1} aria-label="Count" className={input + ' w-16 shrink-0'}
                  value={row.count} onChange={e => updateRow(i, { count: Number(e.target.value) || 1 })} />
                <span className="text-ink-3 text-sm shrink-0">×</span>
                <select className={input + ' flex-1'} value={row.type} onChange={e => updateRow(i, { type: e.target.value })}>
                  <option value="">— Select —</option>
                  {BATTERY_TYPES.map(b => <option key={b}>{b}</option>)}
                </select>
                {rows.length > 1 && (
                  <button type="button" onClick={() => removeRow(i)} title="Remove"
                    className="text-slate-300 hover:text-red-400 shrink-0"><X size={15} /></button>
                )}
              </div>
            ))}
          </div>
          {rows.length < 4 && (
            <button type="button" onClick={addRow}
              className="mt-2 inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700">
              <Plus size={13} /> Add battery option
            </button>
          )}
          <p className="mt-1 text-xs text-ink-3">Add more than one if the light accepts alternatives — e.g. 2× 18350 or 1× 18650.</p>
        </div>
        <Field label="Charging">
          <select className={input} value={chargingType ?? ''} onChange={e => onChargingChange(e.target.value || null)}>
            <option value="">— Select —</option>
            {CHARGING_TYPES.map(c => <option key={c} value={c}>{c === 'usb' ? 'USB' : c === 'magnetic' ? 'Magnetic' : 'None'}</option>)}
          </select>
        </Field>
      </div>
    </div>
  )
}
