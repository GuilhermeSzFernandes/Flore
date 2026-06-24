'use client'

import { useState, useTransition } from 'react'
import { format, addDays, isSunday, parseISO } from 'date-fns'
import FloreLogo from '@/components/FloreLogo'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { registerPatient, createPublicAppointment } from '@/actions/public-booking'
import { toast } from 'sonner'
import { signIn } from 'next-auth/react'
import { CheckCircle2, Clock, CalendarDays, LogIn } from 'lucide-react'
import type { Service } from '@/db/schema'

interface ExistingAppointment {
  startsAt: Date
  durationMin: number
}

interface PatientData {
  id: string
  name: string
  phone: string
}

interface Props {
  professional: { id: string; displayName: string; slug: string }
  services: Service[]
  existingAppointments: ExistingAppointment[]
  patient: PatientData | null
  isLoggedIn: boolean
  sessionUser: { name: string; email: string } | null
}

function getAvailableSlots(date: Date, existing: ExistingAppointment[], serviceDuration: number): Date[] {
  const slots: Date[] = []
  for (let hour = 8; hour <= 17; hour++) {
    const slot = new Date(date)
    slot.setHours(hour, 0, 0, 0)
    const slotEnd = new Date(slot.getTime() + serviceDuration * 60000)
    const isOccupied = existing.some((apt) => {
      const start = new Date(apt.startsAt)
      const end   = new Date(start.getTime() + apt.durationMin * 60000)
      return slot < end && slotEnd > start
    })
    if (!isOccupied) slots.push(slot)
  }
  return slots
}

export default function PublicBookingForm({
  professional,
  services,
  existingAppointments,
  patient: initialPatient,
  isLoggedIn,
  sessionUser,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess]         = useState(false)
  const [patient, setPatient]         = useState<PatientData | null>(initialPatient)

  // campos de cadastro
  const [regName,  setRegName]  = useState(sessionUser?.name  ?? '')
  const [regPhone, setRegPhone] = useState('')

  // campos de agendamento
  const [selectedDate,    setSelectedDate]    = useState<string>('')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedSlot,    setSelectedSlot]    = useState<string>('')

  const dates = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i + 1))
    .filter((d) => !isSunday(d))

  const availableSlots = selectedDate && selectedService
    ? getAvailableSlots(parseISO(selectedDate), existingAppointments, selectedService.durationMin)
    : []

  function handleServiceChange(name: string) {
    const svc = services.find((s) => s.name === name) ?? null
    setSelectedService(svc)
    setSelectedSlot('')
  }

  function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('professionalId', professional.id)
    startTransition(async () => {
      const result = await registerPatient(fd)
      if (result.success) {
        setPatient(result.patient)
      } else {
        toast.error(result.error ?? 'Erro ao cadastrar')
      }
    })
  }

  async function handleBook(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedSlot) { toast.error('Selecione um horário'); return }
    const fd = new FormData(e.currentTarget)
    fd.set('professionalId', professional.id)
    fd.set('startsAt', selectedSlot)
    startTransition(async () => {
      const result = await createPublicAppointment(fd)
      if (result.success) setSuccess(true)
      else toast.error(result.error ?? 'Erro ao agendar')
    })
  }

  // ── Tela de sucesso ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'oklch(0.963 0.006 80)' }}>
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full" style={{ background: 'oklch(0.575 0.115 27 / 12%)' }}>
            <CheckCircle2 className="w-8 h-8" style={{ color: 'oklch(0.575 0.115 27)' }} />
          </div>
          <div>
            <h2 className="text-2xl font-display font-semibold" style={{ color: 'oklch(0.155 0.015 155)' }}>
              Agendamento solicitado!
            </h2>
            <p className="text-sm mt-2" style={{ color: 'oklch(0.45 0.012 155)' }}>
              <strong>{professional.displayName}</strong> entrará em contato para confirmar sua sessão.
            </p>
          </div>
          <p className="text-xs" style={{ color: 'oklch(0.60 0.010 155)' }}>
            Fique de olho no seu WhatsApp.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.963 0.006 80)' }}>
      <div className="max-w-xl mx-auto px-4 py-12 space-y-8">

        {/* Header */}
        <div className="text-center space-y-1">
          <FloreLogo size={18} textClassName="text-xs font-semibold uppercase tracking-widest" textColor="oklch(0.575 0.115 27)" />
          <h1 className="text-3xl font-display font-semibold" style={{ color: 'oklch(0.155 0.015 155)' }}>
            {professional.displayName}
          </h1>
          <p className="text-sm" style={{ color: 'oklch(0.50 0.010 155)' }}>
            Agende sua sessão online
          </p>
        </div>

        {/* ── Não logada ─────────────────────────────────────────────────── */}
        {!isLoggedIn && (
          <div className="rounded-xl border p-6 bg-white text-center space-y-4" style={{ borderColor: 'oklch(0.88 0.012 80)' }}>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full" style={{ background: 'oklch(0.575 0.115 27 / 10%)' }}>
              <LogIn className="w-6 h-6" style={{ color: 'oklch(0.575 0.115 27)' }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'oklch(0.155 0.015 155)' }}>
                Faça login para agendar
              </p>
              <p className="text-xs mt-1" style={{ color: 'oklch(0.55 0.010 155)' }}>
                É necessário entrar com sua conta Google para solicitar um agendamento.
              </p>
            </div>
            <button
              onClick={() => signIn('google', { callbackUrl: `/cliente/cadastro?next=${encodeURIComponent(`/agendar/${professional.slug}`)}` })}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'oklch(0.575 0.115 27)' }}
            >
              <LogIn className="w-4 h-4" />
              Entrar com Google
            </button>
          </div>
        )}

        {/* ── Logada mas não cadastrada → formulário de cadastro rápido ──── */}
        {isLoggedIn && !patient && (
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="rounded-xl border p-5 space-y-4 bg-white" style={{ borderColor: 'oklch(0.88 0.012 80)' }}>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'oklch(0.155 0.015 155)' }}>
                  Primeiro acesso
                </p>
                <p className="text-xs mt-1" style={{ color: 'oklch(0.55 0.010 155)' }}>
                  Complete seu cadastro para agendar com <strong>{professional.displayName}</strong>.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium" style={{ color: 'oklch(0.35 0.012 155)' }}>
                    Nome completo *
                  </Label>
                  <Input
                    name="name"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Maria Silva"
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium" style={{ color: 'oklch(0.35 0.012 155)' }}>
                    Telefone com DDD *
                  </Label>
                  <Input
                    name="phone"
                    required
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="(11) 99999-0000"
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-12 text-sm font-semibold"
              size="lg"
            >
              {isPending ? 'Cadastrando...' : 'Confirmar cadastro e continuar'}
            </Button>
          </form>
        )}

        {/* ── Cadastrada → formulário de agendamento ──────────────────────── */}
        {isLoggedIn && patient && (
          <>
            {/* Chip da paciente */}
            <div className="rounded-xl border p-4 bg-white flex items-center gap-3" style={{ borderColor: 'oklch(0.88 0.012 80)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: 'oklch(0.575 0.115 27)' }}>
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'oklch(0.155 0.015 155)' }}>{patient.name}</p>
                <p className="text-xs" style={{ color: 'oklch(0.55 0.010 155)' }}>Cliente cadastrado</p>
              </div>
            </div>

            <form onSubmit={handleBook} className="space-y-5">
              {/* Serviço */}
              <div className="rounded-xl border p-5 space-y-4 bg-white" style={{ borderColor: 'oklch(0.88 0.012 80)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'oklch(0.575 0.115 27)' }}>1</div>
                  <p className="text-sm font-semibold" style={{ color: 'oklch(0.155 0.015 155)' }}>Escolha o serviço</p>
                </div>
                <Select name="serviceName" required onValueChange={(v) => { if (typeof v === 'string') handleServiceChange(v) }}>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground ml-1.5">
                          · {s.durationMin} min
                          {s.priceInCents ? ` · R$ ${(s.priceInCents / 100).toFixed(2).replace('.', ',')}` : ''}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedService && (
                  <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2" style={{ background: 'oklch(0.575 0.115 27 / 8%)', color: 'oklch(0.40 0.08 27)' }}>
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Duração: {selectedService.durationMin} minutos</span>
                  </div>
                )}
              </div>

              {/* Data */}
              <div className="rounded-xl border p-5 space-y-4 bg-white" style={{ borderColor: 'oklch(0.88 0.012 80)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'oklch(0.575 0.115 27)' }}>2</div>
                  <p className="text-sm font-semibold" style={{ color: 'oklch(0.155 0.015 155)' }}>Escolha a data</p>
                </div>
                <Select
                  name="date"
                  required
                  onValueChange={(v) => { setSelectedDate(typeof v === 'string' ? v : ''); setSelectedSlot('') }}
                >
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder="Selecione uma data" />
                  </SelectTrigger>
                  <SelectContent>
                    {dates.map((d) => {
                      const v = format(d, 'yyyy-MM-dd')
                      return (
                        <SelectItem key={v} value={v}>
                          <span className="capitalize">{format(d, "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Horários */}
              {selectedDate && selectedService && (
                <div className="rounded-xl border p-5 space-y-4 bg-white" style={{ borderColor: 'oklch(0.88 0.012 80)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'oklch(0.575 0.115 27)' }}>3</div>
                    <p className="text-sm font-semibold" style={{ color: 'oklch(0.155 0.015 155)' }}>Escolha o horário</p>
                  </div>
                  {availableSlots.length === 0 ? (
                    <div className="text-center py-4">
                      <CalendarDays className="w-8 h-8 mx-auto mb-2" style={{ color: 'oklch(0.70 0.010 155)' }} />
                      <p className="text-sm" style={{ color: 'oklch(0.55 0.010 155)' }}>Nenhum horário disponível nessa data.</p>
                      <p className="text-xs mt-1" style={{ color: 'oklch(0.65 0.010 155)' }}>Tente outra data.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((slot) => {
                        const iso      = slot.toISOString()
                        const selected = selectedSlot === iso
                        return (
                          <button
                            key={iso}
                            type="button"
                            onClick={() => setSelectedSlot(iso)}
                            className="h-10 rounded-lg text-sm font-medium border transition-all"
                            style={selected ? {
                              background:  'oklch(0.575 0.115 27)',
                              borderColor: 'oklch(0.575 0.115 27)',
                              color:       'white',
                            } : {
                              background:  'white',
                              borderColor: 'oklch(0.88 0.012 80)',
                              color:       'oklch(0.30 0.015 155)',
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
              <div className="rounded-xl border p-5 space-y-3 bg-white" style={{ borderColor: 'oklch(0.88 0.012 80)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'oklch(0.575 0.115 27)' }}>4</div>
                  <p className="text-sm font-semibold" style={{ color: 'oklch(0.155 0.015 155)' }}>Observações</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium" style={{ color: 'oklch(0.35 0.012 155)' }}>Observações (opcional)</Label>
                  <Textarea name="notes" rows={2} placeholder="Alguma informação relevante..." className="resize-none text-sm" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending || !selectedSlot}
                className="w-full h-12 text-sm font-semibold"
                size="lg"
              >
                {isPending ? 'Enviando...' : 'Solicitar agendamento'}
              </Button>
            </form>
          </>
        )}

        <p className="text-center text-xs" style={{ color: 'oklch(0.65 0.008 155)' }}>
          Agendamento via <span className="font-semibold" style={{ color: 'oklch(0.575 0.115 27)' }}>Flore</span>
        </p>
      </div>
    </div>
  )
}
