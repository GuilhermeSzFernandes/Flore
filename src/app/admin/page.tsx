import { db } from '@/db'
import { professionals, patients, appointments, users } from '@/db/schema'
import { count, eq, gte, desc } from 'drizzle-orm'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Users, CalendarDays, UserCheck, TrendingUp } from 'lucide-react'

const planLabels: Record<string, string> = {
  beta:   'Beta',
  free:   'Gratuito',
  pro:    'Pro',
  clinic: 'Clínica',
}

const planColors: Record<string, string> = {
  beta:   'bg-violet-100 text-violet-700',
  free:   'bg-zinc-100 text-zinc-600',
  pro:    'bg-emerald-100 text-emerald-700',
  clinic: 'bg-blue-100 text-blue-700',
}

export default async function AdminPage() {
  const now           = new Date()
  const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalProfessionalsRows,
    totalPatientsRows,
    appointmentsMonthRows,
    totalAppointmentsRows,
    byPlanRows,
    recentProfessionals,
  ] = await Promise.all([
    db.select({ c: count() }).from(professionals),
    db.select({ c: count() }).from(patients),
    db.select({ c: count() }).from(appointments).where(gte(appointments.startsAt, startOfMonth)),
    db.select({ c: count() }).from(appointments),
    db.select({ plan: professionals.plan, c: count() }).from(professionals).groupBy(professionals.plan),
    db.select({
      id:          professionals.id,
      displayName: professionals.displayName,
      plan:        professionals.plan,
      createdAt:   professionals.createdAt,
      email:       users.email,
    })
      .from(professionals)
      .leftJoin(users, eq(professionals.userId, users.id))
      .orderBy(desc(professionals.createdAt))
      .limit(5),
  ])

  const totalProfessionals   = totalProfessionalsRows[0].c
  const totalPatients        = totalPatientsRows[0].c
  const appointmentsThisMonth = appointmentsMonthRows[0].c
  const totalAppointments    = totalAppointmentsRows[0].c

  const stats = [
    { label: 'Profissionais',          value: totalProfessionals,    icon: UserCheck,    color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Clientes',               value: totalPatients,         icon: Users,        color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Agendamentos este mês',  value: appointmentsThisMonth, icon: CalendarDays, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Agendamentos totais',    value: totalAppointments,     icon: TrendingUp,   color: 'text-amber-600',  bg: 'bg-amber-50' },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão geral da plataforma — {format(now, "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição por plano */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Distribuição por plano</h2>
          <div className="space-y-3">
            {(['beta', 'free', 'pro', 'clinic'] as const).map(plan => {
              const row   = byPlanRows.find(r => r.plan === plan)
              const value = row?.c ?? 0
              const pct   = totalProfessionals > 0 ? Math.round((Number(value) / Number(totalProfessionals)) * 100) : 0
              return (
                <div key={plan} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${planColors[plan]}`}>
                      {planLabels[plan]}
                    </span>
                    <span className="text-muted-foreground">{value} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Profissionais recentes */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Últimas profissionais cadastradas</h2>
            <a href="/admin/profissionais" className="text-xs text-primary hover:underline">Ver todas →</a>
          </div>
          <div className="divide-y divide-border">
            {recentProfessionals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma profissional cadastrada.</p>
            ) : (
              recentProfessionals.map(p => (
                <div key={p.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColors[p.plan]}`}>
                      {planLabels[p.plan]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(p.createdAt, 'dd/MM/yy')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
