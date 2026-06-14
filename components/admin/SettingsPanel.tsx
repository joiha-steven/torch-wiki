'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import TeamPanel from './TeamPanel'

export default function SettingsPanel() {
  const [gaId, setGaId]         = useState('')
  const [gaEnabled, setGaEnabled] = useState(false)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['ga_measurement_id', 'ga_enabled'])
      const map = Object.fromEntries((data ?? []).map(r => [r.key, r.value]))
      setGaId(map.ga_measurement_id ?? '')
      setGaEnabled(map.ga_enabled === 'true')
      setLoading(false)
    }
    load()
  }, [])

  async function save() {
    setSaving(true); setMsg('')
    const upserts = [
      { key: 'ga_measurement_id', value: gaId.trim() },
      { key: 'ga_enabled',        value: String(gaEnabled) },
    ]
    const { error } = await supabase.from('settings').upsert(upserts, { onConflict: 'key' })
    if (error) {
      setMsg('Error saving settings.')
    } else {
      setMsg('Saved.')
      setTimeout(() => setMsg(''), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="flex justify-center py-16 text-ink-3"><Loader2 size={20} className="animate-spin" /></div>
  }

  return (
    <div className="space-y-6 max-w-lg">

      {/* Google Analytics */}
      <div className="bg-panel rounded-xl border border-line p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">Google Analytics</h2>
            <p className="text-xs text-ink-3 mt-0.5">Track visits, sessions, and user behavior</p>
          </div>
          {/* Toggle */}
          <button
            type="button"
            onClick={() => setGaEnabled(e => !e)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${gaEnabled ? 'bg-brand-500' : 'bg-slate-200 dark:bg-white/[0.07]'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-panel shadow transition-transform ${gaEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-3 mb-1.5">
            Measurement ID <span className="text-ink-3 font-normal">(e.g. G-XXXXXXXXXX)</span>
          </label>
          <input
            type="text"
            value={gaId}
            onChange={e => setGaId(e.target.value)}
            placeholder="G-XXXXXXXXXX"
            className="w-full h-10 border border-line rounded-lg px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-300 bg-panel"
          />
          {gaId && !gaId.match(/^G-[A-Z0-9]+$/) && (
            <p className="text-xs text-amber-600 mt-1">Format should be G-XXXXXXXXXX</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className={`flex items-center gap-1.5 text-xs ${gaEnabled ? 'text-green-600' : 'text-ink-3'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${gaEnabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-white/10'}`} />
            {gaEnabled ? 'Tracking active' : 'Tracking disabled'}
          </div>
          <div className="flex items-center gap-3">
            {msg && <span className="text-xs text-green-600">{msg}</span>}
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-[#33363c] dark:hover:bg-[#3e4148] text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50">
              {saving && <Loader2 size={13} className="animate-spin" />}
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-ink-3">
        Changes take effect within ~5 minutes (cached). Get your Measurement ID from{' '}
        <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-2">Google Analytics</a>.
      </p>

      {/* Team */}
      <TeamPanel />
    </div>
  )
}
