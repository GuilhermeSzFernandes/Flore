import { Skeleton } from '@/components/ui/skeleton'

export default function ConfiguracoesLoading() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-7 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-5 md:gap-7 items-start">
        {/* Tabs */}
        <div className="flex md:flex-col gap-2 p-2 bg-card rounded-2xl border border-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 flex-1 md:w-full rounded-xl" />
          ))}
        </div>

        {/* Conteúdo */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
