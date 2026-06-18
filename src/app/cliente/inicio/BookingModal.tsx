'use client'

import { useState, useTransition, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckIcon } from 'lucide-react'
import { loadBookingData, createClientAppointment } from '@/actions/cliente'
import { toast } from 'sonner'
import {
  format,
  addDays,
  isSunday,
  isBefore,
  startOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, CalendarDays, CheckCircle2, Loader2, ChevronLeft, ChevronRight, User } from 'lucide-react'

function ServicePicker({
  services,
  selectedService,
  onSelect,
}: {
  services: Service[]
  selectedService: Service | null
  onSelect: (s: Service) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <input type="hidden" name="serviceName" value={selectedService?.name ?? ''} required />
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm transition-colors"
        style={{
          borderColor: 'oklch(0.88 0.012 80)',
          background: 'white',
          color: selectedService ? 'oklch(0.155 0.015 155)' : 'oklch(0.65 0.015 155)',
        }}
      >
        <span>{selectedService?.name ?? 'Selecione o serviço'}</span>
        <CheckIcon
          className="w-4 h-4 shrink-0 opacity-50 rotate-90 -rotate-90"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 150ms',
            opacity: 0.5,
          }}
        />
      </button>

      {open && (
        <div
          className="absolute z-50 left-0 right-0 mt-1 rounded-lg border bg-popover shadow-md overflow-hidden"
          style={{ borderColor: 'oklch(0.88 0.012 80)' }}
        >
          {services.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum serviço disponível</p>
          ) : (
            services.map(s => {
              const selected = selectedService?.id === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { onSelect(s); setOpen(false) }}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-sm text-left transition-colors"
                  style={{
                    background: selected ? 'oklch(0.575 0.115 27 / 8%)' : 'transparent',
                    color: 'oklch(0.155 0.015 155)',
                  }}
                  onMouseEnter={e => {
                    if (!selected) (e.currentTarget as HTMLElement).style.background = 'oklch(0.963 0.006 80)'
                  }}
                  onMouseLeave={e => {
                    if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs ml-3 shrink-0" style={{ color: 'oklch(0.55 0.010 155)' }}>
                    {s.durationMin} min
                    {s.priceInCents ? ` · R$ ${(s.priceInCents / 100).toFixed(2).replace('.', ',')}` : ''}
                    {selected && <CheckIcon className="w-3.5 h-3.5 inline ml-1.5" />}
                  </span>
                </button>
              )
            })
          )}
        </div>
      )}

      {/* fecha ao clicar fora */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  )
}
import type { Service } from '@/db/schema'

interface ExistingAppointment { startsAt: Date; durationMin: number }
interface BlockedTime { date: string; startTime: string | null; endTime: string | null }
interface LunchBreak { start: string; end: string }

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  professional: { id: string; displayName: string } | null
  onSuccess: () => void
}

const BUFFER_MIN = 10
const SLOT_STEP  = 10 // minutos

function getAvailableSlots(
  date: Date,
  existing: ExistingAppointment[],
  durationMin: number,
  blocked: BlockedTime[],
  lunchBreak: LunchBreak | null,
): Date[] {
  const slots: Date[] = []
  const now     = new Date()
  const dateStr = format(date, 'yyyy-MM-dd')
  const dayBlocked   = blocked.filter(b => b.date === dateStr)
  const fullDayBlock = dayBlocked.some(b => !b.startTime && !b.endTime)

  if (fullDayBlock) return []

  const dayStart = 8 * 60      // 08:00 em minutos
  const dayEnd   = 18 * 60     // 18:00 — o slot + duração não pode ultrapassar isso

  for (let mins = dayStart; mins + durationMin <= dayEnd; mins += SLOT_STEP) {
    const slot    = new Date(date); slot.setHours(Math.floor(mins / 60), mins % 60, 0, 0)
    const slotEnd = new Date(slot.getTime() + durationMin * 60000)

    if (isBefore(slot, now)) continue

    // Conflito com agendamentos existentes + buffer de 10 min após cada atendimento
    const occupied = existing.some(apt => {
      const s           = new Date(apt.startsAt)
      const e           = new Date(s.getTime() + apt.durationMin * 60000)
      const eWithBuffer = new Date(e.getTime() + BUFFER_MIN * 60000)
      return slot < eWithBuffer && slotEnd > s
    })
    if (occupied) continue

    const blockedSlot = dayBlocked.some(b => {
      if (!b.startTime || !b.endTime) return false
      const [bh, bm] = b.startTime.split(':').map(Number)
      const [eh, em] = b.endTime.split(':').map(Number)
      const blockStart = new Date(date); blockStart.setHours(bh, bm, 0, 0)
      const blockEnd   = new Date(date); blockEnd.setHours(eh, em, 0, 0)
      return slot < blockEnd && slotEnd > blockStart
    })
    if (blockedSlot) continue

    // Conflito com horário de almoço recorrente
    if (lunchBreak) {
      const [lh, lm] = lunchBreak.start.split(':').map(Number)
      const [eh, em] = lunchBreak.end.split(':').map(Number)
      const lunchStart = new Date(date); lunchStart.setHours(lh, lm, 0, 0)
      const lunchEnd   = new Date(date); lunchEnd.setHours(eh, em, 0, 0)
      if (slot < lunchEnd && slotEnd > lunchStart) continue
    }

    slots.push(slot)
  }
  return slots
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function MiniCalendar({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string
  onSelectDate: (date: string) => void
}) {
  const today    = startOfDay(new Date())
  const maxDate  = addDays(today, 30)
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today))

  const monthStart = startOfMonth(viewMonth)
  const monthEnd   = endOfMonth(viewMonth)
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const leadingBlanks = getDay(monthStart) // 0=Dom

  function isAvailable(d: Date) {
    return !isSunday(d) && !isBefore(d, today) && !isBefore(maxDate, d)
  }

  function canGoPrev() {
    return !isBefore(subMonths(viewMonth, 1), startOfMonth(today))
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'oklch(0.88 0.012 80)' }}>
      {/* Header do mês */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: 'oklch(0.575 0.115 27 / 6%)' }}>
        <button
          type="button"
          onClick={() => setViewMonth(m => subMonths(m, 1))}
          disabled={!canGoPrev()}
          className="w-7 h-7 flex items-center justify-center rounded-md transition-colors disabled:opacity-30"
          style={{ color: 'oklch(0.40 0.08 27)' }}
          onMouseEnter={e => { if (canGoPrev()) (e.currentTarget as HTMLElement).style.background = 'oklch(0.575 0.115 27 / 12%)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold capitalize" style={{ color: 'oklch(0.155 0.015 155)' }}>
          {format(viewMonth, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth(m => addMonths(m, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
          style={{ color: 'oklch(0.40 0.08 27)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'oklch(0.575 0.115 27 / 12%)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7 px-2 pt-2 pb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-wider pb-1"
            style={{ color: 'oklch(0.65 0.010 155)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7 gap-0.5 px-2 pb-3">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map(day => {
          const iso      = format(day, 'yyyy-MM-dd')
          const available = isAvailable(day)
          const selected  = selectedDate === iso

          return (
            <button
              key={iso}
              type="button"
              disabled={!available}
              onClick={() => onSelectDate(iso)}
              className="h-8 w-full rounded-lg text-sm font-medium transition-all disabled:opacity-25 disabled:cursor-not-allowed"
              style={selected ? {
                background: 'oklch(0.575 0.115 27)',
                color: 'white',
              } : available ? {
                background: 'transparent',
                color: 'oklch(0.30 0.015 155)',
              } : {
                background: 'transparent',
                color: 'oklch(0.70 0.010 155)',
              }}
              onMouseEnter={e => {
                if (available && !selected)
                  (e.currentTarget as HTMLElement).style.background = 'oklch(0.575 0.115 27 / 12%)'
              }}
              onMouseLeave={e => {
                if (!selected)
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <div className="px-4 py-2 border-t text-xs font-medium text-center capitalize"
          style={{ borderColor: 'oklch(0.88 0.012 80)', color: 'oklch(0.575 0.115 27)' }}>
          {format(parseISO(selectedDate), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </div>
      )}
    </div>
  )
}

export default function BookingModal({ open, onOpenChange, professional, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading]         = useState(false)
  const [done, setDone]               = useState(false)

  const [services, setServices]               = useState<Service[]>([])
  const [existingApts, setExistingApts]       = useState<ExistingAppointment[]>([])
  const [blocked, setBlocked]                 = useState<BlockedTime[]>([])
  const [lunchBreak, setLunchBreak]           = useState<LunchBreak | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate]       = useState('')
  const [selectedSlot, setSelectedSlot]       = useState('')
  const [notes, setNotes]                     = useState('')

  const availableSlots = selectedDate && selectedService
    ? getAvailableSlots(parseISO(selectedDate), existingApts, selectedService.durationMin, blocked, lunchBreak)
    : []

  useEffect(() => {
    if (!open || !professional) return
    setLoading(true)
    loadBookingData(professional.id).then(data => {
      if (data) {
        setServices(data.services)
        setExistingApts(data.existingAppointments as ExistingAppointment[])
        setBlocked(data.blockedTimes as BlockedTime[])
        try {
          const lb = data.lunchBreak ? JSON.parse(data.lunchBreak) : null
          setLunchBreak(lb && lb.start && lb.end ? lb : null)
        } catch { setLunchBreak(null) }
      }
      setLoading(false)
    })
  }, [open, professional])

  function handleClose() {
    setDone(false)
    setSelectedService(null)
    setSelectedDate('')
    setSelectedSlot('')
    setNotes('')
    onOpenChange(false)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedSlot) { toast.error('Selecione um horário'); return }
    const fd = new FormData(e.currentTarget)
    fd.set('professionalId', professional!.id)
    fd.set('startsAt', selectedSlot)
    startTransition(async () => {
      const result = await createClientAppointment(fd)
      if (result.success) { setDone(true); onSuccess() }
      else toast.error(result.error ?? 'Erro ao agendar')
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle
            className="font-display font-semibold text-lg"
            style={{ color: 'oklch(0.155 0.015 155)' }}
          >
            {done ? 'Agendado!' : `Agendar com ${professional?.displayName ?? ''}`}
          </DialogTitle>
        </DialogHeader>

        {/* ── Sucesso ─────────────────────────────────────────────── */}
        {done && (
          <div className="space-y-5 text-center py-4">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-full mx-auto"
              style={{ background: 'oklch(0.575 0.115 27 / 10%)' }}
            >
              <CheckCircle2 className="w-7 h-7" style={{ color: 'oklch(0.575 0.115 27)' }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'oklch(0.155 0.015 155)' }}>
                Agendamento solicitado!
              </p>
              <p className="text-sm mt-1" style={{ color: 'oklch(0.55 0.010 155)' }}>
                <strong>{professional?.displayName}</strong> entrará em contato para confirmar.
              </p>
            </div>
            <Button className="w-full h-10 font-medium" onClick={handleClose}>
              Fechar
            </Button>
          </div>
        )}

        {/* ── Carregando ──────────────────────────────────────────── */}
        {!done && loading && (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Carregando agenda...</span>
          </div>
        )}

        {/* ── Formulário ──────────────────────────────────────────── */}
        {!done && !loading && (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Profissional (placeholder para times futuros) */}
            <div className="space-y-2">
              <Label
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'oklch(0.55 0.010 155)' }}
              >
                Profissional
              </Label>
              <div
                className="flex items-center gap-2.5 h-10 px-3 rounded-md border text-sm"
                style={{ borderColor: 'oklch(0.88 0.012 80)', color: 'oklch(0.30 0.015 155)' }}
              >
                <User className="w-4 h-4 shrink-0 opacity-50" />
                <span>{professional?.displayName}</span>
              </div>
            </div>

            {/* Serviço */}
            <div className="space-y-2">
              <Label
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'oklch(0.55 0.010 155)' }}
              >
                Serviço
              </Label>
              <ServicePicker
                services={services}
                selectedService={selectedService}
                onSelect={(s) => { setSelectedService(s); setSelectedSlot('') }}
              />
              {selectedService && (
                <div
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg"
                  style={{ background: 'oklch(0.575 0.115 27 / 8%)', color: 'oklch(0.40 0.08 27)' }}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  Duração: {selectedService.durationMin} minutos
                </div>
              )}
            </div>

            {/* Data — calendário estilizado */}
            <div className="space-y-2">
              <Label
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'oklch(0.55 0.010 155)' }}
              >
                Data
              </Label>
              <MiniCalendar
                selectedDate={selectedDate}
                onSelectDate={(d) => { setSelectedDate(d); setSelectedSlot('') }}
              />
            </div>

            {/* Horários */}
            {selectedDate && selectedService && (
              <div className="space-y-2">
                <Label
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'oklch(0.55 0.010 155)' }}
                >
                  Horário
                </Label>
                {availableSlots.length === 0 ? (
                  <div
                    className="text-center py-4 rounded-xl border"
                    style={{ borderColor: 'oklch(0.88 0.012 80)' }}
                  >
                    <CalendarDays className="w-6 h-6 mx-auto mb-1.5" style={{ color: 'oklch(0.70 0.010 155)' }} />
                    <p className="text-sm" style={{ color: 'oklch(0.55 0.010 155)' }}>
                      Nenhum horário disponível. Tente outra data.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map(slot => {
                      const iso      = slot.toISOString()
                      const selected = selectedSlot === iso
                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => setSelectedSlot(iso)}
                          className="h-9 rounded-lg text-sm font-medium border transition-all"
                          style={selected ? {
                            background: 'oklch(0.575 0.115 27)',
                            borderColor: 'oklch(0.575 0.115 27)',
                            color: 'white',
                          } : {
                            background: 'white',
                            borderColor: 'oklch(0.88 0.012 80)',
                            color: 'oklch(0.30 0.015 155)',
                          }}
                        >
                          {format(slot, 'HH:mm')}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Observações */}
            <div className="space-y-1.5">
              <Label
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'oklch(0.55 0.010 155)' }}
              >
                Observações <span className="normal-case font-normal">(opcional)</span>
              </Label>
              <Textarea
                name="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Alguma informação relevante..."
                className="resize-none text-sm"
              />
            </div>

            <Button
              type="submit"
              disabled={isPending || !selectedSlot}
              className="w-full h-10 font-medium"
            >
              {isPending ? 'Agendando...' : 'Solicitar agendamento'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
