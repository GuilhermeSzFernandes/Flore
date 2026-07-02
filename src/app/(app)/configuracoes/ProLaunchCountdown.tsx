'use client'

import { useEffect, useState } from 'react'
import { Rocket } from 'lucide-react'

// Lançamento do plano Pro — 10 de agosto de 2026, meia-noite em São Paulo.
const LAUNCH = new Date('2026-08-10T00:00:00-03:00')

const terracota = 'oklch(0.575 0.115 27)'
const terracotaSoft = 'oklch(0.575 0.115 27 / 8%)'

type Parts = { days: number; hours: number; minutes: number; seconds: number }

function diff(target: Date): Parts | null {
  const ms = target.getTime() - Date.now()
  if (ms <= 0) return null
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms / 3_600_000) % 24),
    minutes: Math.floor((ms / 60_000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
  }
}

export default function ProLaunchCountdown() {
  // Só calcula no cliente (evita mismatch de hidratação com o horário do servidor)
  const [parts, setParts] = useState<Parts | null | undefined>(undefined)

  useEffect(() => {
    setParts(diff(LAUNCH))
    const id = setInterval(() => setParts(diff(LAUNCH)), 1000)
    return () => clearInterval(id)
  }, [])

  if (parts === undefined) {
    // placeholder estável para o primeiro render (SSR/pré-hidratação)
    return <div className="h-[104px] rounded-xl" style={{ background: terracotaSoft }} aria-hidden />
  }

  const units =
    parts === null
      ? null
      : [
          { value: parts.days, label: parts.days === 1 ? 'dia' : 'dias' },
          { value: parts.hours, label: 'h' },
          { value: parts.minutes, label: 'min' },
          { value: parts.seconds, label: 'seg' },
        ]

  return (
    <div className="rounded-xl p-5" style={{ background: terracotaSoft, border: '1px solid oklch(0.575 0.115 27 / 18%)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Rocket className="w-4 h-4 shrink-0" style={{ color: terracota }} />
        <p className="text-sm font-semibold text-foreground">
          {units ? 'Contagem para o lançamento do Pro' : 'O plano Pro chegou!'}
        </p>
      </div>

      {units ? (
        <div className="grid grid-cols-4 gap-2">
          {units.map((u) => (
            <div key={u.label} className="rounded-lg bg-card border border-border py-2.5 text-center">
              <p className="text-2xl font-display font-semibold text-foreground tabular-nums leading-none">
                {String(u.value).padStart(2, '0')}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{u.label}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Suas semanas acumuladas já podem ser aplicadas. 🎉
        </p>
      )}

      <p className="text-xs text-muted-foreground mt-3 text-center">10 de agosto de 2026</p>
    </div>
  )
}
