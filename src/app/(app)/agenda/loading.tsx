import { Skeleton } from '@/components/ui/skeleton'

export default function AgendaLoading() {
  return (
    <div className="p-4 md:p-8">
      {/* Barra de controles */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>

      {/* Linhas de horário */}
      <div className="space-y-2 max-w-3xl">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-14 w-12 rounded-md shrink-0" />
            <Skeleton className="h-14 flex-1 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
