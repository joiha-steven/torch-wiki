'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Sun, Moon, Monitor, Clock, Check } from 'lucide-react'

type Mode = 'dark' | 'light' | 'system' | 'time'
const STORAGE_KEY = 'theme-mode'

function systemDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}
function timeDark() {
  const h = new Date().getHours()
  return h >= 18 || h < 6
}
export function resolveTheme(mode: Mode): 'dark' | 'light' {
  if (mode === 'system') return systemDark() ? 'dark' : 'light'
  if (mode === 'time') return timeDark() ? 'dark' : 'light'
  return mode
}
function applyTheme(mode: Mode) {
  const theme = resolveTheme(mode)
  document.documentElement.dataset.theme = theme
  // keep the browser chrome (address bar) in sync with the resolved theme
  const meta = document.querySelector('meta[name="theme-color"]:not([media])')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#17181b' : '#f6f6f3')
}

const OPTIONS: { mode: Mode; label: string; Icon: typeof Sun; hint?: () => string }[] = [
  { mode: 'dark',   label: 'Dark',   Icon: Moon },
  { mode: 'light',  label: 'Light',  Icon: Sun },
  { mode: 'system', label: 'System', Icon: Monitor, hint: () => (systemDark() ? 'Dark now' : 'Light now') },
  { mode: 'time',   label: 'Auto',   Icon: Clock,   hint: () => (timeDark() ? '6pm–6am' : '6am–6pm') },
]

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>('light')   // default: light
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // hydrate stored mode (data-theme was already set by the inline FOUC script)
  useEffect(() => {
    setMode((localStorage.getItem(STORAGE_KEY) as Mode) || 'light')
  }, [])

  // re-resolve when OS scheme changes (system) / every minute (time)
  useEffect(() => {
    applyTheme(mode)
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onSys = () => { if (mode === 'system') applyTheme('system') }
    mql.addEventListener('change', onSys)
    const timer = mode === 'time' ? window.setInterval(() => applyTheme('time'), 60000) : undefined
    return () => { mql.removeEventListener('change', onSys); if (timer) clearInterval(timer) }
  }, [mode])

  // click outside closes
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const pick = useCallback((m: Mode) => {
    localStorage.setItem(STORAGE_KEY, m)
    setMode(m)
    applyTheme(m)
    setOpen(false)
  }, [])

  const Current = (OPTIONS.find(o => o.mode === mode) ?? OPTIONS[1]).Icon

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Theme"
        className="glass-dark w-[34px] h-[34px] grid place-items-center rounded-full text-[#f3f3f0]/90"
      >
        <Current size={18} strokeWidth={1.9} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 w-[236px] rounded-2xl p-1.5 z-50"
          style={{ background: 'var(--menu-bg)', border: '1px solid var(--menu-border)', boxShadow: '0 16px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)' }}
        >
          {OPTIONS.map(({ mode: m, label, Icon, hint }) => {
            const active = mode === m
            return (
              <button
                key={m}
                onClick={() => pick(m)}
                className="theme-row flex items-center gap-3 w-full px-2.5 py-2 rounded-lg text-left"
                style={{
                  background: active ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--menu-text)',
                }}
              >
                <Icon size={17} strokeWidth={1.9} style={{ color: active ? 'var(--accent)' : 'var(--ink-3)' }} />
                <span className="flex-1 text-[13.5px] font-medium">{label}</span>
                {hint && <span className="text-[10.5px] tabular-nums" style={{ color: 'var(--ink-3)' }}>{hint()}</span>}
                {active && <Check size={15} strokeWidth={2.4} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
