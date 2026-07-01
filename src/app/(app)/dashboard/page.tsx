import { auth } from '@/auth'
import { db } from '@/db'
import { appointments, professionals, restrictions, patients, services } from '@/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import {
  format,
  endOfDay,
  startOfMonth,
  subMonths,
  subDays,
  addDays,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { nowInApp, toAppTz } from '@/lib/datetime'
import Link from 'next/link'
import {
  CalendarCheck,
  Wallet,
  UserPlus,
  TrendingUp,
  Sparkles,
  Scissors,
  BellRing,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { AppointmentStatusBadge } from '@/components/AppointmentStatusBadge'
import { RestrictionChip } from '@/components/RestrictionChip'
import { WhatsAppReminderButton } from '@/components/WhatsAppReminderButton'
import { StatCard } from './components/StatCard'
import { AppointmentsChart, type ChartDay } from './components/AppointmentsChart'
import { RankedBars, type RankedItem } from './components/RankedBars'

const brl = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

const pctTrend = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? { value: 'novo', direction: 'up' as const } : undefined
  const diff = Math.round(((current - previous) / previous) * 100)
  if (diff === 0) return undefined
  return { value: `${Math.abs(diff)}%`, direction: diff > 0 ? ('up' as const) : ('down' as const) }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const professional = await db.query.professionals.findFirst({
    where: eq(professionals.userId, session.user.id),
  })
  if (!professional) redirect('/onboarding')

  const today = nowInApp()
  const monthStart = startOfMonth(today)
  const lastMonthStart = startOfMonth(subMonths(today, 1))
  const historyStart = lastMonthStart // cobre mês atual + anterior
  // Para tendência justa: mês passado só até o mesmo dia/hora de hoje
  // (comparar mês parcial atual contra mês passado inteiro distorceria a seta).
  const prevPeriodEnd = subMonths(today, 1)

  // ── Consultas ──────────────────────────────────────────────
  const [serviceRows, history, upcoming, newPatientsThis, newPatientsPrev] = await Promise.all([
    db.query.services.findMany({ where: eq(services.professionalId, professional.id) }),
    db.query.appointments.findMany({
      where: and(
        eq(appointments.professionalId, professional.id),
        gte(appointments.startsAt, historyStart),
        lte(appointments.startsAt, endOfDay(today)),
      ),
      orderBy: (t, { asc }) => [asc(t.startsAt)],
    }),
    db.query.appointments.findMany({
      where: and(
        eq(appointments.professionalId, professional.id),
        eq(appointments.status, 'scheduled'),
        gte(appointments.startsAt, today),
        lte(appointments.startsAt, addDays(today, 7)),
      ),
      orderBy: (t, { asc }) => [asc(t.startsAt)],
    }),
    db.$count(
      patients,
      and(eq(patients.professionalId, professional.id), gte(patients.createdAt, monthStart)),
    ),
    db.$count(
      patients,
      and(
        eq(patients.professionalId, professional.id),
        gte(patients.createdAt, lastMonthStart),
        lte(patients.createdAt, prevPeriodEnd),
      ),
    ),
  ])

  // Mapa de preços por nome de serviço (desnormalização: appointment guarda só o nome)
  const priceByService = new Map<string, number>()
  for (const s of serviceRows) {
    if (s.priceInCents != null) priceByService.set(s.name.trim().toLowerCase(), s.priceInCents)
  }
  const priceOf = (name: string) => priceByService.get(name.trim().toLowerCase()) ?? 0

  const isCancelled = (s: string) => s === 'cancelled'

  // ── Agendamentos de hoje ───────────────────────────────────
  const todayAppointments = history.filter((a) => isSameDay(toAppTz(a.startsAt), today))

  const appointmentsWithRestrictions = await Promise.all(
    todayAppointments.map(async (apt) => {
      if (!apt.patientId) return { apt, activeRestrictions: [] }
      const activeRestrictions = await db.query.restrictions.findMany({
        where: and(eq(restrictions.patientId, apt.patientId), eq(restrictions.active, true)),
      })
      return { apt, activeRestrictions }
    }),
  )

  // ── KPIs ───────────────────────────────────────────────────
  const monthAppts = history.filter((a) => toAppTz(a.startsAt) >= monthStart)
  const lastMonthAppts = history.filter(
    (a) => toAppTz(a.startsAt) >= lastMonthStart && toAppTz(a.startsAt) < monthStart,
  )

  const revenueThis = monthAppts
    .filter((a) => a.status === 'done')
    .reduce((sum, a) => sum + priceOf(a.serviceName), 0)
  const revenuePrev = lastMonthAppts
    .filter((a) => a.status === 'done' && toAppTz(a.startsAt) <= prevPeriodEnd)
    .reduce((sum, a) => sum + priceOf(a.serviceName), 0)

  const doneThis = monthAppts.filter((a) => a.status === 'done').length
  const noShowThis = monthAppts.filter((a) => a.status === 'no_show').length
  const attendanceRate =
    doneThis + noShowThis === 0 ? null : Math.round((doneThis / (doneThis + noShowThis)) * 100)

  const todayCount = todayAppointments.filter((a) => !isCancelled(a.status)).length

  // ── Gráfico: atendimentos por dia (14 dias) ────────────────
  const chartDays: ChartDay[] = eachDayOfInterval({
    start: subDays(today, 13),
    end: today,
  }).map((day) => ({
    label: format(day, 'd', { locale: ptBR }),
    weekday: format(day, 'EEEE', { locale: ptBR }),
    count: history.filter((a) => isSameDay(toAppTz(a.startsAt), day) && !isCancelled(a.status)).length,
    isToday: isSameDay(day, today),
  }))

  // ── Serviços mais procurados (mês) ─────────────────────────
  const serviceCounts = new Map<string, number>()
  for (const a of monthAppts) {
    if (isCancelled(a.status)) continue
    serviceCounts.set(a.serviceName, (serviceCounts.get(a.serviceName) ?? 0) + 1)
  }
  const popularServices: RankedItem[] = [...serviceCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }))

  // ── Faturamento por serviço (mês) ──────────────────────────
  const revenueByService = new Map<string, number>()
  for (const a of monthAppts) {
    if (a.status !== 'done') continue
    const price = priceOf(a.serviceName)
    if (price === 0) continue
    revenueByService.set(a.serviceName, (revenueByService.get(a.serviceName) ?? 0) + price)
  }
  const serviceRevenue: RankedItem[] = [...revenueByService.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }))

  // ── Insights dinâmicos ─────────────────────────────────────
  const insights: { icon: typeof Sparkles; text: string }[] = []
  if (upcoming.length > 0)
    insights.push({
      icon: BellRing,
      text: `${upcoming.length} agendamento${upcoming.length > 1 ? 's' : ''} nos próximos 7 dias aguardando confirmação.`,
    })
  // Dia da semana com mais atendimentos no agregado dos 14 dias (não um único dia)
  const weekdayTotals = new Map<string, number>()
  for (const d of chartDays) weekdayTotals.set(d.weekday, (weekdayTotals.get(d.weekday) ?? 0) + d.count)
  const [busiestWeekday, busiestWeekdayCount] = [...weekdayTotals.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0] ?? ['', 0]
  if (busiestWeekdayCount > 0)
    insights.push({
      icon: TrendingUp,
      text: `Seu dia mais movimentado costuma ser ${busiestWeekday}.`,
    })
  if (attendanceRate != null && attendanceRate < 80 && doneThis + noShowThis >= 3)
    insights.push({
      icon: Sparkles,
      text: `Taxa de comparecimento em ${attendanceRate}% — enviar lembretes ajuda a reduzir faltas.`,
    })
  if (popularServices[0])
    insights.push({
      icon: Scissors,
      text: `"${popularServices[0].label}" é o serviço mais procurado do mês.`,
    })

  const weekday = format(today, 'EEEE', { locale: ptBR })
  const dateLabel = format(today, "d 'de' MMMM", { locale: ptBR })
  const firstName = professional.displayName.split(' ')[0]

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1 capitalize">
            {weekday} · {dateLabel}
          </p>
          <h1 className="text-3xl font-display font-semibold text-foreground">
            Olá, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {todayCount === 0
              ? 'Nenhum atendimento marcado para hoje.'
              : `Você tem ${todayCount} atendimento${todayCount > 1 ? 's' : ''} hoje.`}
          </p>
        </div>
        <Link
          href="/agenda"
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg shrink-0"
          style={{ background: 'oklch(0.575 0.115 27)', color: 'white' }}
        >
          <Plus className="w-4 h-4" />
          Novo agendamento
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
        <StatCard
          label="Atendimentos hoje"
          value={String(todayCount)}
          icon={CalendarCheck}
          hint={upcoming.length > 0 ? `${upcoming.length} pendentes na semana` : undefined}
        />
        <StatCard
          label="Faturamento do mês"
          value={brl(revenueThis)}
          icon={Wallet}
          trend={pctTrend(revenueThis, revenuePrev)}
          hint={`${doneThis} atendimento${doneThis === 1 ? '' : 's'} concluído${doneThis === 1 ? '' : 's'}`}
        />
        <StatCard
          label="Novos clientes"
          value={String(newPatientsThis)}
          icon={UserPlus}
          trend={pctTrend(newPatientsThis, newPatientsPrev)}
          hint="neste mês"
        />
        <StatCard
          label="Taxa de comparecimento"
          value={attendanceRate == null ? '—' : `${attendanceRate}%`}
          icon={TrendingUp}
          hint={attendanceRate == null ? 'sem dados no mês' : `${noShowThis} falta${noShowThis === 1 ? '' : 's'}`}
        />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div
          className="rounded-xl border p-4 mb-4"
          style={{
            background: 'oklch(0.575 0.115 27 / 5%)',
            borderColor: 'oklch(0.575 0.115 27 / 18%)',
          }}
        >
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'oklch(0.575 0.115 27)' }} />
            <span className="text-xs font-semibold" style={{ color: 'oklch(0.575 0.115 27)' }}>
              Destaques da semana
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {insights.slice(0, 4).map((ins, i) => {
              const Icon = ins.icon
              return (
                <div key={i} className="flex items-start gap-2.5 bg-card rounded-lg p-3 border border-border">
                  <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'oklch(0.575 0.115 27)' }} />
                  <p className="text-sm text-foreground/80 leading-snug">{ins.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Grid de duas colunas */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-4 items-start">
        {/* Coluna principal */}
        <div className="flex flex-col gap-4 min-w-0">
          <AppointmentsChart days={chartDays} />

          <div className="grid md:grid-cols-2 gap-4">
            <RankedBars
              title="Serviços mais procurados"
              subtitle="Este mês"
              icon={Scissors}
              items={popularServices}
              emptyLabel="Sem atendimentos no período."
              valueFormatter={(v) => `${v}×`}
            />
            <RankedBars
              title="Faturamento por serviço"
              subtitle="Este mês"
              icon={Wallet}
              items={serviceRevenue}
              emptyLabel="Cadastre preços nos serviços para ver aqui."
              valueFormatter={brl}
            />
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* Agenda de hoje */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Agenda de hoje</h3>
              <Link
                href="/agenda"
                className="text-xs font-medium inline-flex items-center gap-0.5"
                style={{ color: 'oklch(0.575 0.115 27)' }}
              >
                Ver agenda
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {appointmentsWithRestrictions.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🌿</span>
                </div>
                <p className="text-sm text-muted-foreground">Dia livre. Aproveite para descansar.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border -my-1">
                {appointmentsWithRestrictions.map(({ apt, activeRestrictions }) => (
                  <div key={apt.id} className="py-3 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 text-center w-9">
                        <p className="text-lg font-display font-medium text-foreground tabular-nums leading-none">
                          {format(toAppTz(apt.startsAt), 'HH')}
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {format(toAppTz(apt.startsAt), 'mm')}
                        </p>
                      </div>
                      <div className="self-stretch w-px bg-border" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground leading-tight truncate">
                          {apt.patientName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {apt.serviceName} · {apt.durationMin} min
                        </p>
                      </div>
                      <AppointmentStatusBadge status={apt.status} />
                    </div>

                    {activeRestrictions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-12">
                        {activeRestrictions.map((r) => (
                          <RestrictionChip key={r.id} technique={r.technique} />
                        ))}
                      </div>
                    )}

                    {(apt.status === 'scheduled' || apt.status === 'confirmed') && (
                      <div className="pl-12">
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

          {/* Confirmações pendentes */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <BellRing className="w-4 h-4 shrink-0" style={{ color: 'oklch(0.575 0.115 27)' }} />
              <h3 className="text-sm font-semibold text-foreground">Aguardando confirmação</h3>
            </div>

            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Tudo confirmado. Nenhuma pendência.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-border -my-1">
                {upcoming.slice(0, 5).map((apt) => (
                  <div key={apt.id} className="py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{apt.patientName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {format(toAppTz(apt.startsAt), "EEE, d 'de' MMM · HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 truncate max-w-[40%]">
                      {apt.serviceName}
                    </span>
                  </div>
                ))}
                {upcoming.length > 5 && (
                  <Link
                    href="/agenda"
                    className="text-xs font-medium py-3 inline-flex items-center gap-0.5"
                    style={{ color: 'oklch(0.575 0.115 27)' }}
                  >
                    Ver mais {upcoming.length - 5}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
