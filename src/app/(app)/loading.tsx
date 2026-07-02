import { Skeleton } from '@/components/ui/skeleton'

// Fallback genérico para páginas do app sem loading próprio.
export default function AppLoading() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
