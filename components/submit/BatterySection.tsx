import { BatteryOption } from '@/lib/types'
import { X, Plus } from 'lucide-react'
import { BATTERY_TYPES, CHARGING_TYPES } from './shared'

type Props = {
  rows: BatteryOption[]
  updateRow: (i: number, patch: Partial<BatteryOption>) => void
  addRow: () => void
  removeRow: (i: number) => void
  chargingType: string | null
  onChargingChange: (v: string | null) => void
}

// Local control class — note we do NOT reuse the shared `input` (it is w-full),
// which would fight the fixed-width count selector in a flex row.
const ctrl = 'h-10 text-sm border border-line rounded-lg bg-panel focus:outline-none focus:ring-2 focus:ring-brand-300'
const COUNTS = [1, 2, 3, 4, 5, 6, 8]

export default function BatterySection({ rows, updateRow, addRow, removeRow, chargingType, onChargingChange }: Props) {
  return (
    <div className="space-y-5">
      <p className="text-[13px] font-semibold text-ink-2">Battery &amp; Charging</p>

      {/* Battery — up to 4 alternatives, each a count × a type from the list */}
      <div>
        <label className="block text-xs font-medium text-ink-3 mb-1">Battery options</label>
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <select aria-label="Count" className={`${ctrl} w-[68px] shrink-0 pl-2.5 pr-1`}
                value={row.count} onChange={e => updateRow(i, { count: Number(e.target.value) })}>
                {COUNTS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-ink-3 text-sm shrink-0">×</span>
              <select aria-label="Battery type" className={`${ctrl} flex-1 min-w-0 px-3`}
                value={row.type} onChange={e => updateRow(i, { type: e.target.value })}>
                <option value="">— Select battery —</option>
                {BATTERY_TYPES.map(b => <option key={b}>{b}</option>)}
              </select>
              {rows.length > 1 && (
                <button type="button" onClick={() => removeRow(i)} aria-label="Remove battery option"
                  className="text-ink-3 hover:text-red-400 shrink-0"><X size={15} /></button>
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
        <p className="mt-1.5 text-xs text-ink-3">
          Up to 4. Add more than one only if the light accepts alternatives — e.g. 2× 18350 <em>or</em> 1× 18650.
        </p>
      </div>

      {/* Charging — separate from the battery */}
      <div>
        <label className="block text-xs font-medium text-ink-3 mb-1">Charging</label>
        <select className={`${ctrl} w-full sm:w-56 px-3`} value={chargingType ?? ''}
          onChange={e => onChargingChange(e.target.value || null)}>
          <option value="">— Select —</option>
          {CHARGING_TYPES.map(c => (
            <option key={c} value={c}>{c === 'usb' ? 'USB' : c === 'magnetic' ? 'Magnetic' : 'None'}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
