'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays, subDays, startOfWeek, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AppointmentStatusBadge } from '@/components/AppointmentStatusBadge'
import { RestrictionChip } from '@/components/RestrictionChip'
import { WhatsAppReminderButton } from '@/components/WhatsAppReminderButton'
import { createAppointment, updateAppointmentStatus } from '@/actions/appointments'
import { createSessionNote } from '@/actions/session-notes'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, AlertTriangle, Plus, Phone, FileText } from 'lucide-react'
import type { Appointment, Restriction, Service } from '@/db/schema'

const HOURS = Array.from({ length: 29 }, (_, i) => {
  const totalMinutes = 7 * 60 + i * 30
  return { hour: Math.floor(totalMinutes / 60), minute: totalMinutes % 60 }
})

interface NoteConfig {
  whatWasDoneLabel: string
  whatWasDonePlaceholder: string
  showPainScale: boolean
  tagsLabel: string
  tags: string[]
  showNextTip: boolean
}

const NOTE_CONFIG: Record<string, NoteConfig> = {
  massagist: {
    whatWasDoneLabel:      'O que foi feito',
    whatWasDonePlaceholder:'Descreva as técnicas e procedimentos realizados...',
    showPainScale:         true,
    tagsLabel:             'Áreas tratadas',
    tags: ['Lombar', 'Cervical', 'Joelho E', 'Joelho D', 'Coxa', 'Abdômen', 'Glúteos', 'Braços', 'Pés', 'Face', 'Decote', 'Corpo todo'],
    showNextTip:           true,
  },
  esthetician: {
    whatWasDoneLabel:      'Procedimento realizado',
    whatWasDonePlaceholder:'Descreva o protocolo e produtos aplicados...',
    showPainScale:         false,
    tagsLabel:             'Técnicas utilizadas',
    tags: ['Limpeza de pele', 'Peeling', 'Hidratação', 'Drenagem linfática', 'Massagem facial', 'Sobrancelha', 'Depilação', 'Microagulhamento', 'LED', 'Radiofrequência'],
    showNextTip:           true,
  },
  hairdresser: {
    whatWasDoneLabel:      'Serviço realizado',
    whatWasDonePlaceholder:'Ex: corte + mechas + escova...',
    showPainScale:         false,
    tagsLabel:             'Serviços aplicados',
    tags: ['Corte', 'Coloração', 'Mechas', 'Escova', 'Hidratação', 'Progressiva', 'Cauterização', 'Relaxamento', 'Tintura', 'Penteado'],
    showNextTip:           true,
  },
  manicure: {
    whatWasDoneLabel:      'Serviço realizado',
    whatWasDonePlaceholder:'Ex: manicure + pedicure com esmalte em gel...',
    showPainScale:         false,
    tagsLabel:             'O que foi feito',
    tags: ['Manicure', 'Pedicure', 'Esmaltação simples', 'Esmaltação em gel', 'Gel', 'Acrílico', 'Fibra', 'Remoção', 'Hidratação'],
    showNextTip:           false,
  },
  other: {
    whatWasDoneLabel:      'O que foi feito',
    whatWasDonePlaceholder:'Descreva os procedimentos realizados...',
    showPainScale:         true,
    tagsLabel:             'Áreas / técnicas',
    tags: ['Lombar', 'Cervical', 'Abdômen', 'Braços', 'Pés', 'Face', 'Corpo todo'],
    showNextTip:           true,
  },
}

type AptWithRestrictions = Appointment & { restrictions: Restriction[] }

interface Props {
  appointments: AptWithRestrictions[]
  services: Service[]
  professional: { id: string; displayName: string; specialty: string }
  view: 'day' | 'week'
  selectedDate: string
}

const STATUS_STYLE: Record<Appointment['status'], { background: string; borderColor: string; color: string }> = {
  scheduled: {
    background:  'oklch(0.93 0.022 255 / 65%)',
    borderColor: 'oklch(0.70 0.055 255)',
    color:       'oklch(0.30 0.07 255)',
  },
  confirmed: {
    background:  'oklch(0.94 0.042 68 / 70%)',
    borderColor: 'oklch(0.76 0.09 68)',
    color:       'oklch(0.40 0.12 68)',
  },
  done: {
    background:  'oklch(0.575 0.115 27 / 12%)',
    borderColor: 'oklch(0.575 0.115 27 / 38%)',
    color:       'oklch(0.42 0.10 27)',
  },
  no_show: {
    background:  'oklch(0.93 0.022 350 / 65%)',
    borderColor: 'oklch(0.70 0.055 350)',
    color:       'oklch(0.40 0.09 350)',
  },
  cancelled: {
    background:  'oklch(0.92 0.008 155 / 50%)',
    borderColor: 'oklch(0.74 0.012 155)',
    color:       'oklch(0.52 0.012 155)',
  },
}

const STATUS_ACCENT: Record<Appointment['status'], string> = {
  scheduled: 'oklch(0.55 0.09 255)',
  confirmed:  'oklch(0.62 0.14 68)',
  done:       'oklch(0.575 0.115 27)',
  no_show:    'oklch(0.58 0.12 350)',
  cancelled:  'oklch(0.68 0.010 155)',
}

export default function AgendaClient({ appointments, services, professional, view, selectedDate }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [newDialog, setNewDialog] = useState(false)
  const [slotDate, setSlotDate] = useState('')
  const [selectedApt, setSelectedApt] = useState<AptWithRestrictions | null>(null)
  const [noteModal, setNoteModal] = useState(false)
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [customArea, setCustomArea] = useState('')
  const [painBefore, setPainBefore] = useState(0)
  const [painAfter, setPainAfter] = useState(0)

  const date = parseISO(selectedDate)
  const dateStr = format(date, 'yyyy-MM-dd')

  function navigate(dir: 'prev' | 'next') {
    const days = view === 'week' ? 7 : 1
    const newDate = dir === 'prev' ? subDays(date, days) : addDays(date, days)
    router.push(`/agenda?view=${view}&date=${format(newDate, 'yyyy-MM-dd')}`)
  }

  function getAppointmentsForSlot(hour: number, minute: number, dayOffset = 0) {
    const slotStart = new Date(date)
    if (view === 'week') {
      const weekStart = startOfWeek(date, { weekStartsOn: 0 })
      slotStart.setTime(weekStart.getTime())
      slotStart.setDate(weekStart.getDate() + dayOffset)
    }
    slotStart.setHours(hour, minute, 0, 0)
    return appointments.filter((apt) => {
      const start = new Date(apt.startsAt)
      return start.getTime() === slotStart.getTime()
    })
  }

  async function handleCreateAppointment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createAppointment(fd)
      if (result.success) {
        setNewDialog(false)
        toast.success('Agendamento criado')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Erro ao criar agendamento')
      }
    })
  }

  async function handleStatusChange(status: Appointment['status']) {
    if (!selectedApt) return
    if (status === 'done') { setNoteModal(true); return }
    startTransition(async () => {
      const result = await updateAppointmentStatus(selectedApt.id, status)
      if (result.success) { setSelectedApt(null); toast.success('Status atualizado'); router.refresh() }
      else toast.error(result.error)
    })
  }

  async function handleNoteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedApt) return
    const fd = new FormData(e.currentTarget)
    fd.set('appointmentId', selectedApt.id)
    const areas = [...selectedAreas, ...(customArea.trim() ? [customArea.trim()] : [])]
    areas.forEach(a => fd.append('areasTreated', a))
    startTransition(async () => {
      const result = await createSessionNote(fd)
      if (result.success) {
        setNoteModal(false); setSelectedApt(null); setSelectedAreas([]); setCustomArea('')
        toast.success('Sessão registrada'); router.refresh()
      } else toast.error(result.error)
    })
  }

  const weekDays = view === 'week'
    ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(date, { weekStartsOn: 0 }), i))
    : [date]

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="px-3 md:px-6 py-3 border-b border-border bg-card flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => navigate('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => router.push(`/agenda?view=${view}&date=${format(new Date(), 'yyyy-MM-dd')}`)}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => navigate('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <h2 className="font-display font-medium text-foreground capitalize text-xs md:text-sm flex-1 min-w-0 truncate">
          {view === 'day'
            ? format(date, "EEE, d 'de' MMMM", { locale: ptBR })
            : `Semana de ${format(startOfWeek(date, { weekStartsOn: 0 }), "d 'de' MMMM", { locale: ptBR })}`}
        </h2>

        <div className="flex items-center gap-1 ml-auto">
          <div className="flex gap-1">
            <Button size="sm" variant={view === 'day' ? 'default' : 'outline'} className="h-8 px-3 text-xs"
              onClick={() => router.push(`/agenda?view=day&date=${dateStr}`)}>
              Dia
            </Button>
            <Button size="sm" variant={view === 'week' ? 'default' : 'outline'} className="h-8 px-3 text-xs"
              onClick={() => router.push(`/agenda?view=week&date=${dateStr}`)}>
              Semana
            </Button>
          </div>

          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => { setSlotDate(new Date().toISOString()); setNewDialog(true) }}>
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Novo</span>
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <div className={`grid ${view === 'week' ? 'grid-cols-[52px_repeat(7,1fr)]' : 'grid-cols-[52px_1fr]'}`}>
          {view === 'week' && (
            <>
              <div className="sticky top-0 z-10 bg-background border-b border-r border-border h-10" />
              {weekDays.map((d, i) => (
                <div key={i} className="sticky top-0 z-10 bg-background border-b border-r border-border h-10 flex flex-col items-center justify-center">
                  <p className="text-[10px] text-muted-foreground capitalize">{format(d, 'EEE', { locale: ptBR })}</p>
                  <p className="text-sm font-semibold text-foreground">{format(d, 'd')}</p>
                </div>
              ))}
            </>
          )}

          {HOURS.map(({ hour, minute }, idx) => (
            <React.Fragment key={idx}>
              <div className="border-r border-b border-border text-[10px] text-muted-foreground h-12 flex items-start justify-end pr-2 pt-1">
                {minute === 0 ? `${String(hour).padStart(2, '0')}h` : ''}
              </div>
              {weekDays.map((_, dayOffset) => {
                const slotApts = getAppointmentsForSlot(hour, minute, dayOffset)
                const slotDt = new Date(weekDays[dayOffset])
                slotDt.setHours(hour, minute, 0, 0)

                return (
                  <div
                    key={`s${idx}-${dayOffset}`}
                    className="border-r border-b border-border h-12 relative hover:bg-secondary/50 cursor-pointer transition-colors"
                    onClick={() => { if (!slotApts.length) { setSlotDate(slotDt.toISOString()); setNewDialog(true) } }}
                  >
                    {slotApts.map((apt) => {
                      const heightPx = Math.max((apt.durationMin / 30) * 48 - 4, 20)
                      const s = STATUS_STYLE[apt.status]
                      return (
                        <div
                          key={apt.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedApt(apt) }}
                          className="absolute inset-x-0.5 top-0.5 rounded text-[11px] px-1.5 py-0.5 border cursor-pointer leading-tight z-10 overflow-hidden"
                          style={{
                            height: `${heightPx}px`,
                            background: s.background,
                            borderColor: s.borderColor,
                            color: s.color,
                          }}
                        >
                          <span className="font-semibold">{format(new Date(apt.startsAt), 'HH:mm')}</span>{' '}
                          {apt.patientName}
                          {apt.restrictions.length > 0 && <AlertTriangle className="inline w-2.5 h-2.5 ml-0.5" style={{ color: s.color }} />}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Dialog novo agendamento */}
      <Dialog open={newDialog} onOpenChange={setNewDialog}>
        <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
          {/* Header tintado com terracota */}
          <div className="px-6 pt-6 pb-5" style={{ background: 'oklch(0.575 0.115 27 / 7%)' }}>
            <DialogHeader>
              <DialogTitle className="font-display italic text-xl font-semibold text-foreground leading-tight">
                Novo agendamento
              </DialogTitle>
              {slotDate && (
                <p className="text-sm text-muted-foreground mt-1 capitalize">
                  {format(new Date(slotDate), "EEEE, d 'de' MMMM · HH:mm", { locale: ptBR })}
                </p>
              )}
            </DialogHeader>
          </div>

          <form onSubmit={handleCreateAppointment} className="px-6 py-5 space-y-4">
            {/* Cliente */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cliente</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Nome *</Label>
                  <Input name="patientName" required placeholder="Maria Silva" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Telefone *</Label>
                  <Input name="patientPhone" required placeholder="(11) 99999-0000" className="h-9 text-sm" />
                </div>
              </div>
            </div>

            {/* Serviço */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Serviço</p>
              {services.length > 0 ? (
                <Select name="serviceName" required>
                  <SelectTrigger className="h-9 text-sm w-full">
                    <SelectValue placeholder="Selecionar serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name} ({s.durationMin} min)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input name="serviceName" required placeholder="Nome do serviço" className="h-9 text-sm" />
              )}
            </div>

            {/* Quando */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quando</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Data e hora *</Label>
                  <Input name="startsAt" type="datetime-local" required className="h-9 text-sm"
                    defaultValue={slotDate ? format(new Date(slotDate), "yyyy-MM-dd'T'HH:mm") : ''} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Duração (min)</Label>
                  <Input name="durationMin" type="number" defaultValue="60" min="15" step="15" className="h-9 text-sm" />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Observações</Label>
              <Textarea name="notes" rows={2} className="resize-none text-sm" placeholder="Informações relevantes para esta sessão..." />
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-border">
              <Button type="button" variant="ghost" size="sm" onClick={() => setNewDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="px-5">
                {isPending ? 'Salvando...' : 'Agendar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sheet detalhes */}
      <Sheet open={!!selectedApt} onOpenChange={(o) => !o && setSelectedApt(null)}>
        <SheetContent className="w-96 p-0 overflow-y-auto flex flex-col">
          {selectedApt && (
            <>
              {/* Faixa de status — cor muda conforme o status da consulta */}
              <div
                className="h-1 w-full flex-shrink-0"
                style={{ background: STATUS_ACCENT[selectedApt.status] }}
              />

              {/* Header com fundo pergaminho */}
              <div className="px-6 pt-5 pb-4 flex-shrink-0" style={{ background: 'oklch(0.975 0.008 80)' }}>
                <SheetHeader className="mb-0 space-y-0">
                  <SheetTitle className="font-display italic text-2xl font-semibold text-foreground leading-tight">
                    {selectedApt.patientName}
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground pt-0.5">{selectedApt.serviceName}</p>
                </SheetHeader>

                <div className="flex items-center gap-4 mt-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Horário</span>
                    <span className="text-xl font-semibold tabular-nums text-foreground leading-none">
                      {format(new Date(selectedApt.startsAt), 'HH:mm')}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Duração</span>
                    <span className="text-xl font-semibold tabular-nums text-foreground leading-none">
                      {selectedApt.durationMin} min
                    </span>
                  </div>
                  <div className="ml-auto">
                    <AppointmentStatusBadge status={selectedApt.status} />
                  </div>
                </div>
              </div>

              {/* Corpo */}
              <div className="px-6 py-5 space-y-5 flex-1">
                {/* Telefone */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-foreground">
                    {selectedApt.patientPhone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')}
                  </span>
                </div>

                {/* Observações */}
                {selectedApt.notes && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground italic leading-relaxed">{selectedApt.notes}</p>
                  </div>
                )}

                {/* Restrições — destaque visual por segurança */}
                {selectedApt.restrictions.length > 0 && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
                      Restrições
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedApt.restrictions.map((r) => <RestrictionChip key={r.id} technique={r.technique} />)}
                    </div>
                  </div>
                )}

                {/* WhatsApp */}
                {(selectedApt.status === 'scheduled' || selectedApt.status === 'confirmed') && (
                  <div className="border-t border-border pt-4">
                    <WhatsAppReminderButton appointment={selectedApt} professionalName={professional.displayName} />
                  </div>
                )}

                {/* Ações com hierarquia clara */}
                {selectedApt.status !== 'done' && selectedApt.status !== 'cancelled' && selectedApt.status !== 'no_show' && (
                  <div className="space-y-2 border-t border-border pt-4">
                    {selectedApt.status === 'scheduled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-9 text-sm border-green-300 text-green-700 hover:bg-green-50"
                        onClick={() => handleStatusChange('confirmed')}
                      >
                        Confirmar presença
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="w-full h-9 text-sm"
                      onClick={() => handleStatusChange('done')}
                    >
                      Concluir sessão
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40"
                        onClick={() => handleStatusChange('no_show')}
                      >
                        Registrar falta
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40"
                        onClick={() => handleStatusChange('cancelled')}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal nota pós-consulta */}
      <Dialog open={noteModal} onOpenChange={setNoteModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Nota de sessão</DialogTitle>
          </DialogHeader>
          {(() => {
            const cfg = NOTE_CONFIG[professional.specialty] ?? NOTE_CONFIG.other
            return (
              <form onSubmit={handleNoteSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{cfg.whatWasDoneLabel} *</Label>
                  <Textarea name="whatWasDone" required rows={3} className="resize-none text-sm" placeholder={cfg.whatWasDonePlaceholder} />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">{cfg.tagsLabel}</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {cfg.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedAreas((p) => p.includes(tag) ? p.filter((a) => a !== tag) : [...p, tag])}
                        className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                          selectedAreas.includes(tag)
                            ? 'border-primary text-primary-foreground bg-primary'
                            : 'border-border text-muted-foreground bg-background hover:border-primary/50'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <Input placeholder="Outro..." value={customArea} onChange={(e) => setCustomArea(e.target.value)} className="h-9 text-sm" />
                </div>

                {cfg.showPainScale && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Dor antes: {painBefore}/10</Label>
                      <input type="range" name="painBefore" min={0} max={10} value={painBefore}
                        onChange={(e) => setPainBefore(Number(e.target.value))} className="w-full accent-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Dor depois: {painAfter}/10</Label>
                      <input type="range" name="painAfter" min={0} max={10} value={painAfter}
                        onChange={(e) => setPainAfter(Number(e.target.value))} className="w-full accent-primary" />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    {cfg.showNextTip ? 'Observações / próxima sessão' : 'Observações'}
                  </Label>
                  <Textarea name="observations" rows={2} className="resize-none text-sm" />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" size="sm" onClick={() => setNoteModal(false)}>Cancelar</Button>
                  <Button type="submit" size="sm" disabled={isPending}>
                    {isPending ? 'Salvando...' : 'Registrar sessão'}
                  </Button>
                </DialogFooter>
              </form>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
