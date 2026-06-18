import { AlertTriangle } from 'lucide-react'

export function RestrictionChip({ technique }: { technique: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
      <AlertTriangle className="w-3 h-3 shrink-0" />
      {technique}
    </span>
  )
}
