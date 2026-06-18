'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

export const DAYS = [
  { key: 'mon', label: 'Segunda-feira', short: 'Seg' },
  { key: 'tue', label: 'Terça-feira',   short: 'Ter' },
  { key: 'wed', label: 'Quarta-feira',  short: 'Qua' },
  { key: 'thu', label: 'Quinta-feira',  short: 'Qui' },
  { key: 'fri', label: 'Sexta-feira',   short: 'Sex' },
  { key: 'sat', label: 'Sábado',        short: 'Sáb' },
  { key: 'sun', label: 'Domingo',       short: 'Dom' },
]

export type DaySchedule  = { open: string; close: string }
export type WeekSchedule = Record<string, DaySchedule | null>

export const DEFAULT_SCHEDULE: WeekSchedule = {
  mon: { open: '09:00', close: '18:00' },
  tue: { open: '09:00', close: '18:00' },
  wed: { open: '09:00', close: '18:00' },
  thu: { open: '09:00', close: '18:00' },
  fri: { open: '09:00', close: '18:00' },
  sat: null,
  sun: null,
}

export function parseSchedule(raw: string): WeekSchedule | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null && 'mon' in parsed) return parsed as WeekSchedule
  } catch {}
  return null
}

interface Props {
  value: string
  onChange: (json: string) => void
}

export default function WorkingHoursEditor({ value, onChange }: Props) {
  const [schedule, setSchedule] = useState<WeekSchedule>(() => {
    return parseSchedule(value) ?? { ...DEFAULT_SCHEDULE }
  })

  function update(key: string, patch: Partial<DaySchedule> | null) {
    const next = { ...schedule }
    if (patch === null) {
      next[key] = null
    } else {
      next[key] = { ...(next[key] ?? { open: '09:00', close: '18:00' }), ...patch }
    }
    setSchedule(next)
    onChange(JSON.stringify(next))
  }

  function toggle(key: string) {
    update(key, schedule[key] ? null : { open: '09:00', close: '18:00' })
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'oklch(0.88 0.012 80)' }}>
      {DAYS.map(({ key, label }, i) => {
        const day    = schedule[key]
        const active = day !== null

        return (
          <div
            key={key}
            className="flex items-center gap-3 px-4 py-2.5"
            style={{
              background: active ? 'white' : 'oklch(0.97 0.004 80)',
              borderTop: i > 0 ? '1px solid oklch(0.92 0.006 80)' : undefined,
            }}
          >
            {/* Toggle */}
            <button
              type="button"
              onClick={() => toggle(key)}
              className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
              style={{
                borderColor: active ? 'oklch(0.575 0.115 27)' : 'oklch(0.78 0.012 155)',
                background:  active ? 'oklch(0.575 0.115 27)' : 'transparent',
              }}
            >
              {active && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
            </button>

            {/* Nome do dia */}
            <span
              className="text-sm w-28 shrink-0 font-medium"
              style={{ color: active ? 'oklch(0.20 0.015 155)' : 'oklch(0.65 0.010 155)' }}
            >
              {label}
            </span>

            {/* Horários ou "Fechado" */}
            {active ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={day!.open}
                  onChange={e => update(key, { open: e.target.value })}
                  className="h-8 px-2 rounded-md border text-sm tabular-nums"
                  style={{ borderColor: 'oklch(0.88 0.012 80)', color: 'oklch(0.20 0.015 155)' }}
                />
                <span className="text-xs" style={{ color: 'oklch(0.60 0.010 155)' }}>até</span>
                <input
                  type="time"
                  value={day!.close}
                  onChange={e => update(key, { close: e.target.value })}
                  className="h-8 px-2 rounded-md border text-sm tabular-nums"
                  style={{ borderColor: 'oklch(0.88 0.012 80)', color: 'oklch(0.20 0.015 155)' }}
                />
              </div>
            ) : (
              <span className="text-xs flex-1" style={{ color: 'oklch(0.68 0.010 155)' }}>
                Fechado
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
