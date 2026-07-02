import { Skeleton } from '@/components/ui/skeleton'

export default function ClienteDetalheLoading() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Cabeçalho do cliente */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-14 w-14 rounded-full shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-lg" />
        ))}
      </div>

      {/* Conteúdo */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
