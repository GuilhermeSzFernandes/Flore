import { Skeleton } from '@/components/ui/skeleton'

export default function ClientesLoading() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      <Skeleton className="h-9 w-full max-w-xs rounded-md mb-5" />

      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
