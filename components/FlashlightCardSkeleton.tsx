export default function FlashlightCardSkeleton() {
  return (
    <div className="glass-card rounded-[18px] p-3.5 flex flex-col">
      {/* Thumbnail */}
      <div className="aspect-[4/3] rounded-[12px] bg-white/50 skeleton-shimmer mb-3.5" />

      {/* Category */}
      <div className="h-2.5 w-12 rounded bg-white/50 skeleton-shimmer mb-2" />

      {/* Brand + model */}
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 w-16 rounded bg-white/50 skeleton-shimmer" />
        <div className="h-3.5 w-28 rounded bg-white/50 skeleton-shimmer" />
      </div>

      {/* Spec line */}
      <div className="h-3 w-32 rounded bg-white/50 skeleton-shimmer mt-3" />

      {/* Foot */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-line">
        <div className="h-3.5 w-14 rounded bg-white/50 skeleton-shimmer" />
        <div className="flex gap-1">
          <div className="h-6 w-6 rounded bg-white/50 skeleton-shimmer" />
          <div className="h-6 w-6 rounded bg-white/50 skeleton-shimmer" />
        </div>
      </div>
    </div>
  )
}
