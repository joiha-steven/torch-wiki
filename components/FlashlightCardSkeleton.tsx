export default function FlashlightCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Image area */}
      <div className="h-44 bg-slate-100 skeleton-shimmer" />

      <div className="p-4 space-y-3">
        {/* Brand + model */}
        <div className="space-y-1.5">
          <div className="h-3 w-16 rounded bg-slate-100 skeleton-shimmer" />
          <div className="h-4 w-32 rounded bg-slate-100 skeleton-shimmer" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="h-3.5 rounded bg-slate-100 skeleton-shimmer" />
          <div className="h-3.5 rounded bg-slate-100 skeleton-shimmer" />
          <div className="h-3.5 rounded bg-slate-100 skeleton-shimmer" />
          <div className="h-3.5 rounded bg-slate-100 skeleton-shimmer" />
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="h-3.5 w-16 rounded bg-slate-100 skeleton-shimmer" />
          <div className="flex gap-1">
            <div className="h-6 w-6 rounded bg-slate-100 skeleton-shimmer" />
            <div className="h-6 w-6 rounded bg-slate-100 skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  )
}
