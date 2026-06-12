'use client'

// Floating compare bar shown at the bottom once 1+ flashlights are selected.
export default function CompareBar({
  count,
  onClear,
  onCompare,
}: {
  count: number
  onClear: () => void
  onCompare: () => void
}) {
  if (count === 0) return null

  return (
    <div
      className="floating-nav fixed bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-[22px] text-[#f3f3f0]"
      style={{ width: 'min(1320px, calc(100% - 32px))' }}
    >
      <div className="flex items-center justify-between px-[22px] h-14">
        <span className="text-[#f3f3f0]/70 text-sm">{count} selected</span>
        <div className="flex items-center gap-4">
          <button onClick={onClear} className="text-[#f3f3f0]/60 hover:text-[#f3f3f0] text-xs">Clear</button>
          <button
            onClick={onCompare}
            disabled={count < 2}
            className="bg-brand-500 hover:brightness-95 disabled:opacity-40 text-[#1d1604] text-xs px-4 py-2 rounded-full font-semibold transition-[filter]"
          >
            Compare ({count})
          </button>
        </div>
      </div>
    </div>
  )
}
