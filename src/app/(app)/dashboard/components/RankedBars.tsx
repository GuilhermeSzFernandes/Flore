import type { LucideIcon } from 'lucide-react'

export type RankedItem = { label: string; value: number; caption?: string }

// Lista de barras horizontais ranqueadas — usada para serviços mais procurados
// e horários de pico. Renderizada no servidor.
export function RankedBars({
  title,
  subtitle,
  icon: Icon,
  items,
  emptyLabel,
  valueFormatter = (v) => String(v),
}: {
  title: string
  subtitle?: string
  icon: LucideIcon
  items: RankedItem[]
  emptyLabel: string
  valueFormatter?: (value: number) => string
}) {
  const max = Math.max(1, ...items.map((i) => i.value))

  return (
    <div className="bg-card rounded-xl border border-border p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 shrink-0" style={{ color: 'oklch(0.575 0.115 27)' }} />
        <div>
          <h3 className="text-sm font-semibold text-foreground leading-none">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 my-auto">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col gap-3.5">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-foreground truncate">{item.label}</span>
                <span className="text-xs font-semibold text-foreground tabular-nums shrink-0">
                  {valueFormatter(item.value)}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.928 0.007 80)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(6, (item.value / max) * 100)}%`,
                    background: 'oklch(0.575 0.115 27)',
                  }}
                />
              </div>
              {item.caption && (
                <span className="text-[11px] text-muted-foreground">{item.caption}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
