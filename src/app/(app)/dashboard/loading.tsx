import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-11 w-44 rounded-lg" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[132px] w-full rounded-xl" />
        ))}
      </div>

      {/* Grid principal */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-4 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="grid md:grid-cols-2 gap-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
        <div className="flex flex-col gap-4 min-w-0">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
