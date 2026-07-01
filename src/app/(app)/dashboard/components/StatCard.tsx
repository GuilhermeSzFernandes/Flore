import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
}: {
  label: string
  value: string
  icon: LucideIcon
  hint?: string
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' }
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-4 min-h-[132px] justify-between">
      <div className="flex items-start justify-between gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'oklch(0.575 0.115 27 / 10%)',
            color: 'oklch(0.575 0.115 27)',
          }}
        >
          <Icon className="w-5 h-5" />
        </div>

        {trend && trend.direction !== 'neutral' && (
          <span
            className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full shrink-0"
            style={
              trend.direction === 'up'
                ? { color: 'oklch(0.52 0.13 150)', background: 'oklch(0.52 0.13 150 / 10%)' }
                : { color: 'oklch(0.577 0.245 27)', background: 'oklch(0.577 0.245 27 / 10%)' }
            }
          >
            {trend.direction === 'up' ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-2xl font-display font-semibold text-foreground leading-none tabular-nums">
          {value}
        </p>
        <p className="text-sm font-medium text-foreground/80 mt-1.5 leading-tight">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
    </div>
  )
}
