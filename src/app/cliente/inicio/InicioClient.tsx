'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, PlusCircle, CalendarPlus, CheckCircle2, XCircle, Calendar, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ConnectModal from './ConnectModal'
import BookingModal from './BookingModal'

interface Appointment {
  id: string
  serviceName: string
  startsAt: Date
  durationMin: number
  status: string
  professionalName: string | null
  professionalSlug: string | null
}

interface PastAppointment {
  id: string
  serviceName: string
  startsAt: Date
  durationMin: number
  status: string
  professionalName: string | null
}

interface SessionNote {
  appointmentId: string
  whatWasDone: string
  areasTreated: string[] | null
  painBefore: number | null
  painAfter: number | null
  observations: string | null
  nextSessionTip: string | null
}

interface Professional {
  id: string
  displayName: string
  businessName: string | null
  address: string | null
  slug: string
}

interface Props {
  firstName: string
  userName: string
  userPhone: string
  upcomingAppointments: Appointment[]
  pastAppointments: PastAppointment[]
  notesByApt: Record<string, SessionNote>
  professionals: Professional[]
  initialCode: string
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
}

const PAST_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  done:      { label: 'Concluída',  color: 'oklch(0.45 0.12 290)',  bg: 'oklch(0.45 0.12 290 / 10%)',  icon: CheckCircle2 },
  no_show:   { label: 'Falta',      color: 'oklch(0.50 0.18 25)',   bg: 'oklch(0.50 0.18 25 / 10%)',   icon: XCircle },
  cancelled: { label: 'Cancelado',  color: 'oklch(0.55 0.010 155)', bg: 'oklch(0.55 0.010 155 / 10%)', icon: XCircle },
  scheduled: { label: 'Agendado',   color: 'oklch(0.45 0.010 155)', bg: 'oklch(0.45 0.010 155 / 10%)', icon: Calendar },
}

export default function InicioClient({ firstName, userName, userPhone, upcomingAppointments, pastAppointments, notesByApt, professionals, initialCode }: Props) {
  const router = useRouter()
  const [connectOpen, setConnectOpen] = useState(!!initialCode)
  const [bookingPro, setBookingPro]   = useState<{ id: string; displayName: string } | null>(null)

  function handleConnectSuccess() {
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 pb-24 sm:pb-8 space-y-8">
      {/* Saudação */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold" style={{ color: 'oklch(0.155 0.015 155)' }}>
            Olá, {firstName}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'oklch(0.55 0.010 155)' }}>
            Bem-vinda ao seu painel.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-medium h-9"
          onClick={() => setConnectOpen(true)}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Conectar
        </Button>
      </div>

      {/* Serviços */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.55 0.010 155)' }}>
          Serviços
        </h2>

        {professionals.length === 0 ? (
          <div
            className="rounded-xl border p-6 text-center space-y-3"
            style={{ borderColor: 'oklch(0.88 0.012 80)', background: 'white' }}
          >
            <p className="text-sm font-medium" style={{ color: 'oklch(0.155 0.015 155)' }}>
              Nenhuma profissional conectada ainda
            </p>
            <p className="text-xs" style={{ color: 'oklch(0.60 0.010 155)' }}>
              Peça o código de 6 dígitos para sua profissional e clique em Conectar.
            </p>
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => setConnectOpen(true)}>
              <PlusCircle className="w-3.5 h-3.5" />
              Inserir código
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {professionals.map(pro => (
              <div
                key={pro.id}
                className="rounded-xl border bg-white p-4 flex items-center gap-3"
                style={{ borderColor: 'oklch(0.88 0.012 80)' }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: 'oklch(0.575 0.115 27 / 10%)', color: 'oklch(0.575 0.115 27)' }}>
                  {(pro.businessName ?? pro.displayName).slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'oklch(0.155 0.015 155)' }}>
                    {pro.businessName ?? pro.displayName}
                  </p>
                  {pro.address && (
                    <p className="text-xs truncate flex items-center gap-1 mt-0.5" style={{ color: 'oklch(0.60 0.010 155)' }}>
                      <MapPin className="w-3 h-3 shrink-0" />
                      {pro.address}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  className="gap-1.5 text-xs h-8 shrink-0"
                  onClick={() => setBookingPro({ id: pro.id, displayName: pro.displayName })}
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  Agendar
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Meus agendamentos */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.55 0.010 155)' }}>
          Meus agendamentos
        </h2>
        {upcomingAppointments.length === 0 ? (
          <div className="rounded-xl border p-5 text-center" style={{ borderColor: 'oklch(0.88 0.012 80)', background: 'white' }}>
            <p className="text-sm" style={{ color: 'oklch(0.60 0.010 155)' }}>Nenhum agendamento futuro.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingAppointments.map(apt => (
              <div
                key={apt.id}
                className="rounded-xl border bg-white p-4 flex items-center gap-4"
                style={{ borderColor: 'oklch(0.88 0.012 80)' }}
              >
                <div className="shrink-0 w-14 rounded-lg flex flex-col items-center justify-center py-2"
                  style={{ background: 'oklch(0.575 0.115 27 / 8%)' }}>
                  <span className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: 'oklch(0.575 0.115 27)' }}>
                    {format(new Date(apt.startsAt), 'MMM', { locale: ptBR })}
                  </span>
                  <span className="text-2xl font-display font-semibold leading-none" style={{ color: 'oklch(0.575 0.115 27)' }}>
                    {format(new Date(apt.startsAt), 'd')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: 'oklch(0.155 0.015 155)' }}>
                    {apt.serviceName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs flex items-center gap-1" style={{ color: 'oklch(0.55 0.010 155)' }}>
                      <Clock className="w-3 h-3" />
                      {format(new Date(apt.startsAt), 'HH:mm')} · {apt.durationMin} min
                    </span>
                    {apt.professionalName && (
                      <span className="text-xs" style={{ color: 'oklch(0.55 0.010 155)' }}>
                        {apt.professionalName}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                  style={{
                    background: apt.status === 'confirmed' ? 'oklch(0.52 0.14 150 / 10%)' : 'oklch(0.55 0.010 155 / 10%)',
                    color:      apt.status === 'confirmed' ? 'oklch(0.40 0.14 150)'        : 'oklch(0.45 0.010 155)',
                  }}
                >
                  {STATUS_LABEL[apt.status] ?? apt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Histórico */}
      {pastAppointments.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.55 0.010 155)' }}>
            Histórico
          </h2>
          <div className="space-y-2">
            {pastAppointments.map(apt => {
              const cfg = PAST_STATUS_CONFIG[apt.status] ?? PAST_STATUS_CONFIG.done
              const Icon = cfg.icon
              const note = notesByApt[apt.id]
              return (
                <div
                  key={apt.id}
                  className="rounded-xl border bg-white p-4 space-y-3"
                  style={{ borderColor: 'oklch(0.88 0.012 80)' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm" style={{ color: 'oklch(0.155 0.015 155)' }}>{apt.serviceName}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.010 155)' }}>
                        {format(new Date(apt.startsAt), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        {apt.professionalName && ` · ${apt.professionalName}`}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>

                  {note && (
                    <div className="border-t pt-3 space-y-1" style={{ borderColor: 'oklch(0.88 0.012 80)' }}>
                      <p className="text-sm" style={{ color: 'oklch(0.25 0.012 155)' }}>{note.whatWasDone}</p>
                      {note.areasTreated && note.areasTreated.length > 0 && (
                        <p className="text-xs" style={{ color: 'oklch(0.55 0.010 155)' }}>
                          Áreas: {note.areasTreated.join(', ')}
                        </p>
                      )}
                      {note.painBefore != null && note.painAfter != null && (
                        <p className="text-xs" style={{ color: 'oklch(0.55 0.010 155)' }}>
                          Dor: {note.painBefore}/10 → {note.painAfter}/10
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Modais */}
      <ConnectModal
        open={connectOpen}
        onOpenChange={setConnectOpen}
        initialCode={initialCode}
        initialName={userName}
        initialPhone={userPhone}
        onSuccess={handleConnectSuccess}
      />
      <BookingModal
        open={!!bookingPro}
        onOpenChange={(v) => { if (!v) setBookingPro(null) }}
        professional={bookingPro}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}
