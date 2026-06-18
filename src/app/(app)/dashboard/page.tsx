import { auth } from '@/auth'
import { db } from '@/db'
import { appointments, professionals, restrictions } from '@/db/schema'
import { eq, and, gte, lt } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { format, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AppointmentStatusBadge } from '@/components/AppointmentStatusBadge'
import { RestrictionChip } from '@/components/RestrictionChip'
import { WhatsAppReminderButton } from '@/components/WhatsAppReminderButton'
import { Clock } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const professional = await db.query.professionals.findFirst({
    where: eq(professionals.userId, session.user.id),
  })
  if (!professional) redirect('/onboarding')

  const today = new Date()
  const todayAppointments = await db.query.appointments.findMany({
    where: and(
      eq(appointments.professionalId, professional.id),
      gte(appointments.startsAt, startOfDay(today)),
      lt(appointments.startsAt, endOfDay(today)),
    ),
    orderBy: (t, { asc }) => [asc(t.startsAt)],
  })

  const appointmentsWithRestrictions = await Promise.all(
    todayAppointments.map(async (apt) => {
      if (!apt.patientId) return { apt, activeRestrictions: [] }
      const activeRestrictions = await db.query.restrictions.findMany({
        where: and(
          eq(restrictions.patientId, apt.patientId),
          eq(restrictions.active, true),
        ),
      })
      return { apt, activeRestrictions }
    }),
  )

  const weekday = format(today, 'EEEE', { locale: ptBR })
  const dateLabel = format(today, "d 'de' MMMM", { locale: ptBR })

  // Sugerir upgrade se volume alto ou equipe grande e plano free/beta
  const suggestUpgrade =
    (professional.plan === 'free' || professional.plan === 'beta') &&
    (professional.monthlyVolume === 'around100' ||
     professional.teamSize === 'more_than_10' ||
     (professional.monthlyVolume === 'around50' && professional.teamSize === 'up_to_5'))

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Banner de upgrade */}
      {suggestUpgrade && (
        <div className="mb-6 rounded-xl border px-5 py-4 flex items-center gap-4"
          style={{ background: 'oklch(0.575 0.115 27 / 6%)', borderColor: 'oklch(0.575 0.115 27 / 30%)' }}>
          <span className="text-2xl shrink-0">🚀</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'oklch(0.155 0.015 155)' }}>
              Seu volume merece o plano Pro
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'oklch(0.50 0.010 155)' }}>
              Com {professional.monthlyVolume === 'around100' ? '~100 atendimentos/mês' : 'sua equipe'}, o plano Pro remove todos os limites de agenda e clientes.
            </p>
          </div>
          <a
            href="/configuracoes"
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: 'oklch(0.575 0.115 27)', color: 'white' }}
          >
            Ver planos
          </a>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1 capitalize">
          {weekday}
        </p>
        <h1 className="text-3xl font-display font-semibold text-foreground capitalize">
          {dateLabel}
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          {todayAppointments.length === 0
            ? 'Nenhum agendamento para hoje'
            : `${todayAppointments.length} sessão${todayAppointments.length > 1 ? 'ões' : ''} hoje`}
        </p>
      </div>

      {/* Agendamentos */}
      {appointmentsWithRestrictions.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🌿</span>
          </div>
          <p className="text-sm text-muted-foreground">Dia livre. Aproveite para descansar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointmentsWithRestrictions.map(({ apt, activeRestrictions }) => (
            <div
              key={apt.id}
              className="bg-card rounded-xl border border-border p-5 space-y-3"
            >
              <div className="flex items-start gap-4">
                {/* Horário */}
                <div className="shrink-0 text-center">
                  <p className="text-2xl font-display font-medium text-foreground tabular-nums leading-none">
                    {format(new Date(apt.startsAt), 'HH')}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {format(new Date(apt.startsAt), 'mm')}
                  </p>
                </div>

                {/* Divisor vertical */}
                <div className="self-stretch w-px bg-border" />

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-semibold text-foreground leading-none">{apt.patientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {apt.serviceName}
                    <span className="mx-1 text-border">·</span>
                    {apt.durationMin} min
                  </p>
                </div>

                <AppointmentStatusBadge status={apt.status} />
              </div>

              {activeRestrictions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border">
                  {activeRestrictions.map((r) => (
                    <RestrictionChip key={r.id} technique={r.technique} />
                  ))}
                </div>
              )}

              {(apt.status === 'scheduled' || apt.status === 'confirmed') && (
                <div className="pt-1">
                  <WhatsAppReminderButton
                    appointment={apt}
                    professionalName={professional.displayName}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
