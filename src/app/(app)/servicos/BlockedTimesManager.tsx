'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addBlockedTime, removeBlockedTime } from '@/actions/blocked-times'
import { toast } from 'sonner'
import { CalendarX, Trash2, Clock, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { BlockedTime } from '@/db/schema'

interface Props {
  items: BlockedTime[]
}

export default function BlockedTimesManager({ items: initial }: Props) {
  const [items, setItems]       = useState(initial)
  const [fullDay, setFullDay]   = useState(true)
  const [isPending, start]      = useTransition()
  const today = new Date().toISOString().slice(0, 10)

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('fullDay', String(fullDay))
    const form = e.currentTarget
    start(async () => {
      const result = await addBlockedTime(fd)
      if (!result.success) { toast.error(result.error ?? 'Erro ao bloquear'); return }
      toast.success('Horário bloqueado')
      form.reset()
      setFullDay(true)
      // optimistic: refresh via revalidatePath will update on next navigation
      // for instant feedback we just clear; router.refresh() not available here without useRouter
    })
  }

  function handleRemove(id: string) {
    start(async () => {
      const result = await removeBlockedTime(id)
      if (!result.success) { toast.error(result.error ?? 'Erro'); return }
      setItems(prev => prev.filter(i => i.id !== id))
      toast.success('Bloqueio removido')
    })
  }

  return (
    <div className="space-y-4">
      {/* Formulário */}
      <form onSubmit={handleAdd} className="rounded-xl border border-border bg-background p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-sm font-medium">Data</Label>
            <Input name="date" type="date" required min={today} className="h-10 text-sm" />
          </div>

          {/* Toggle dia inteiro / horário específico */}
          <div className="col-span-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFullDay(v => !v)}
              className="flex items-center gap-2 text-sm"
              style={{ color: 'oklch(0.40 0.080 155)' }}
            >
              <span
                className="w-9 h-5 rounded-full relative transition-colors flex items-center"
                style={{ background: fullDay ? 'oklch(0.575 0.115 27)' : 'oklch(0.82 0.008 155)' }}
              >
                <span
                  className="absolute w-4 h-4 bg-white rounded-full shadow transition-all"
                  style={{ left: fullDay ? '18px' : '2px' }}
                />
              </span>
              Dia inteiro
            </button>
          </div>

          {!fullDay && (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Das</Label>
                <Input name="startTime" type="time" required={!fullDay} className="h-10 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Até</Label>
                <Input name="endTime" type="time" required={!fullDay} className="h-10 text-sm" />
              </div>
            </>
          )}

          <div className="col-span-2 space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">Motivo <span className="font-normal">(opcional)</span></Label>
            <Input name="reason" placeholder="Ex: feriado, compromisso pessoal…" className="h-10 text-sm" />
          </div>
        </div>

        <Button type="submit" size="sm" disabled={isPending} className="gap-1.5">
          <CalendarX className="w-3.5 h-3.5" />
          {isPending ? 'Salvando…' : 'Bloquear horário'}
        </Button>
      </form>

      {/* Lista */}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum bloqueio agendado.</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {items.map(item => {
            const dateLabel = format(parseISO(item.date), "EEEE, d 'de' MMMM", { locale: ptBR })
            const timeLabel = item.startTime && item.endTime
              ? `${item.startTime} – ${item.endTime}`
              : 'Dia inteiro'
            return (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-background">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium capitalize" style={{ color: 'oklch(0.20 0.015 155)' }}>
                    {dateLabel}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3" style={{ color: 'oklch(0.60 0.010 155)' }} />
                    <span className="text-xs" style={{ color: 'oklch(0.55 0.010 155)' }}>{timeLabel}</span>
                    {item.reason && (
                      <span className="text-xs" style={{ color: 'oklch(0.65 0.010 155)' }}>· {item.reason}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  disabled={isPending}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
