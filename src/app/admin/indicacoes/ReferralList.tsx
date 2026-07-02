'use client'

import { useState } from 'react'
import { ChevronRight, Users, ArrowRight } from 'lucide-react'

const planColors: Record<string, string> = {
  beta: 'bg-violet-100 text-violet-700',
  free: 'bg-zinc-100 text-zinc-600',
  pro: 'bg-emerald-100 text-emerald-700',
  clinic: 'bg-blue-100 text-blue-700',
}
const planLabels: Record<string, string> = {
  beta: 'Beta', free: 'Gratuito', pro: 'Pro', clinic: 'Clínica',
}

export type ReferredPro = {
  id: string
  name: string
  email: string | null
  plan: string
  createdAtLabel: string
}

export type ReferrerRow = ReferredPro & {
  referralCode: string | null
  count: number
  referred: ReferredPro[]
}

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${planColors[plan] ?? planColors.free}`}>
      {planLabels[plan] ?? plan}
    </span>
  )
}

function Row({ pro }: { pro: ReferrerRow }) {
  const [open, setOpen] = useState(false)
  const clickable = pro.count > 0

  const header = (
    <>
      {/* Contador */}
      <div
        className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
        style={{ background: pro.count > 0 ? 'oklch(0.575 0.115 27 / 10%)' : 'oklch(0.963 0.006 80)' }}
      >
        <span
          className="text-lg font-bold leading-none"
          style={{ color: pro.count > 0 ? 'oklch(0.575 0.115 27)' : 'oklch(0.65 0.010 155)' }}
        >
          {pro.count}
        </span>
        <span className="text-[9px] text-muted-foreground mt-0.5">
          {pro.count === 1 ? 'indicada' : 'indicadas'}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground truncate">{pro.name}</p>
          <PlanBadge plan={pro.plan} />
        </div>
        <p className="text-xs text-muted-foreground truncate">{pro.email}</p>
      </div>

      {/* Código + data */}
      <div className="text-right shrink-0">
        <p className="font-mono text-xs font-semibold text-foreground tracking-wider">{pro.referralCode ?? '—'}</p>
        <p className="text-xs text-muted-foreground">{pro.createdAtLabel}</p>
      </div>

      {/* Chevron (só quando há indicados) */}
      {clickable ? (
        <ChevronRight
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
          style={{ color: 'oklch(0.575 0.115 27)' }}
        />
      ) : (
        <span className="w-4 shrink-0" aria-hidden />
      )}
    </>
  )

  return (
    <div>
      {clickable ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="w-full flex items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/40"
        >
          {header}
        </button>
      ) : (
        <div className="flex items-center gap-4 px-5 py-4">{header}</div>
      )}

      {/* Indicados */}
      {clickable && open && (
        <div className="bg-secondary/30 border-t border-border px-5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Profissionais indicadas por {pro.name}
          </p>
          <ul className="space-y-1">
            {pro.referred.map((child) => (
              <li key={child.id} className="flex items-center gap-3 py-2 pl-1">
                <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: 'oklch(0.575 0.115 27)' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground truncate">{child.name}</p>
                    <PlanBadge plan={child.plan} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{child.email}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">{child.createdAtLabel}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function ReferralList({ rows }: { rows: ReferrerRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="p-12 flex flex-col items-center gap-3 text-center">
        <Users className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Nenhuma profissional cadastrada ainda.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {rows.map((pro) => (
        <Row key={pro.id} pro={pro} />
      ))}
    </div>
  )
}
