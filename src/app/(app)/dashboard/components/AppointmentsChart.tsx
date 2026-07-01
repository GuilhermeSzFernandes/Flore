// Gráfico de barras dos atendimentos por dia (SVG puro, sem dependências).
// Renderizado no servidor — recebe os dados já agregados.
export type ChartDay = { label: string; weekday: string; count: number; isToday: boolean }

export function AppointmentsChart({ days }: { days: ChartDay[] }) {
  const max = Math.max(1, ...days.map((d) => d.count))
  const total = days.reduce((sum, d) => sum + d.count, 0)
  const busiest = days.reduce((a, b) => (b.count > a.count ? b : a), days[0])

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Atendimentos</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Últimos 14 dias</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-display font-semibold text-foreground leading-none tabular-nums">
            {total}
          </p>
          <p className="text-xs text-muted-foreground mt-1">no período</p>
        </div>
      </div>

      <div className="flex items-end gap-1.5 h-32">
        {days.map((d, i) => {
          const heightPct = d.count === 0 ? 4 : Math.max(8, (d.count / max) * 100)
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-md transition-colors relative"
                  style={{
                    height: `${heightPct}%`,
                    background: d.isToday
                      ? 'oklch(0.575 0.115 27)'
                      : d.count === 0
                        ? 'oklch(0.905 0.008 82)'
                        : 'oklch(0.575 0.115 27 / 28%)',
                  }}
                  title={`${d.count} atendimento${d.count === 1 ? '' : 's'}`}
                >
                  {d.count > 0 && (
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-foreground/70 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.count}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`text-[10px] tabular-nums ${
                  d.isToday ? 'font-semibold text-foreground' : 'text-muted-foreground'
                }`}
              >
                {d.label}
              </span>
            </div>
          )
        })}
      </div>

      {busiest && busiest.count > 0 && (
        <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
          Dia mais movimentado:{' '}
          <span className="font-semibold text-foreground capitalize">
            {busiest.weekday} ({busiest.count})
          </span>
        </p>
      )}
    </div>
  )
}
