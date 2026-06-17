import { Flashlight } from '@/lib/types'
import { Field, input, NumberInput, BEAM_TYPES } from './shared'

type Props = {
  data: Partial<Flashlight>
  set: (k: keyof Flashlight, v: unknown) => void
  num: (v: string) => number | null
}

export function OutputBeamFields({ data, set, num }: Props) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-ink-2 mb-3">Output & Beam</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Field label="Max Lumens">
          <NumberInput className={input} value={data.max_lumens ?? ''} onChange={e => set('max_lumens', num(e.target.value))} placeholder="e.g. 1000" />
        </Field>
        <Field label="Min Lumens">
          <NumberInput className={input} value={data.min_lumens ?? ''} onChange={e => set('min_lumens', num(e.target.value))} placeholder="e.g. 5" />
        </Field>
        <Field label="Beam Distance (m)">
          <NumberInput className={input} value={data.beam_distance_m ?? ''} onChange={e => set('beam_distance_m', num(e.target.value))} placeholder="e.g. 300" />
        </Field>
        <Field label="Candela (cd)">
          <NumberInput className={input} value={data.candela ?? ''} onChange={e => set('candela', num(e.target.value))} placeholder="e.g. 22500" />
        </Field>
        <Field label="Beam Type">
          <select className={input} value={data.beam_type ?? ''} onChange={e => set('beam_type', e.target.value || null)}>
            <option value="">- Select -</option>
            {BEAM_TYPES.map(b => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Number of LEDs">
          <NumberInput className={input} value={data.led_count ?? ''} onChange={e => set('led_count', num(e.target.value))} placeholder="e.g. 1" />
        </Field>
        <Field label="Driver">
          <input className={input} value={data.driver_type ?? ''} onChange={e => set('driver_type', e.target.value || null)} placeholder="e.g. Buck, FET, Linear" />
        </Field>
      </div>
    </div>
  )
}

export function DimensionFields({ data, set, num }: Props) {
  return (
    <>
      <div>
        <p className="text-[13px] font-semibold text-ink-2 mb-3">Size & Weight</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Length (mm)">
            <NumberInput className={input} value={data.length_mm ?? ''} onChange={e => set('length_mm', num(e.target.value))} />
          </Field>
          <Field label="Head Diameter (mm)">
            <NumberInput className={input} value={data.head_diameter_mm ?? ''} onChange={e => set('head_diameter_mm', num(e.target.value))} />
          </Field>
          <Field label="Body Diameter (mm)">
            <NumberInput className={input} value={data.body_diameter_mm ?? ''} onChange={e => set('body_diameter_mm', num(e.target.value))} />
          </Field>
          <Field label="Weight (g)">
            <NumberInput className={input} value={data.weight_g ?? ''} onChange={e => set('weight_g', num(e.target.value))} />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Field label="Material">
          <input className={input} value={data.material ?? ''} onChange={e => set('material', e.target.value || null)} placeholder="e.g. Aluminum" />
        </Field>
        <Field label="IP Rating">
          <input className={input} value={data.ip_rating ?? ''} onChange={e => set('ip_rating', e.target.value || null)} placeholder="e.g. IPX8" />
        </Field>
        <Field label="Impact Resistance (m)">
          <NumberInput className={input} value={data.impact_resistance_m ?? ''} onChange={e => set('impact_resistance_m', num(e.target.value))} />
        </Field>
        <Field label="Est. Retail Price (USD)">
          <NumberInput className={input} value={data.price_usd ?? ''} onChange={e => set('price_usd', num(e.target.value))} placeholder="e.g. 349" />
        </Field>
      </div>
    </>
  )
}
