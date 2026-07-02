import { Skeleton } from '@/components/ui/skeleton'

export default function ServicosLoading() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-7 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-5 md:gap-7 items-start">
        {/* Guias */}
        <div className="flex md:flex-col gap-2 p-2 bg-card rounded-2xl border border-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 flex-1 md:w-full rounded-xl" />
          ))}
        </div>

        {/* Conteúdo */}
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
