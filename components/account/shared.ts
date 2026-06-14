export type Tab = 'profile' | 'security'
export type MfaStep = 'idle' | 'qr' | 'verify' | 'codes' | 'disabling'

export const inp = 'w-full h-10 border border-line rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-panel'

// Nickname: letters, numbers, - and _ only, 3–20 chars
export function nickError(v: string) {
  if (!v) return null
  if (v.length < 3) return 'Minimum 3 characters'
  if (v.length > 20) return 'Maximum 20 characters'
  if (!/^[a-zA-Z0-9_-]+$/.test(v)) return 'Only letters, numbers, - and _ allowed'
  return null
}
