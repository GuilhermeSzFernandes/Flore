import { db } from '@/db'
import { professionals, patients, appointments, users } from '@/db/schema'
import { count, eq, desc } from 'drizzle-orm'
import { format } from 'date-fns'
import { PlanSelector } from './PlanSelector'

const planColors: Record<string, string> = {
  beta:   'bg-violet-100 text-violet-700',
  free:   'bg-zinc-100 text-zinc-600',
  pro:    'bg-emerald-100 text-emerald-700',
  clinic: 'bg-blue-100 text-blue-700',
}

const planLabels: Record<string, string> = {
  beta:   'Beta',
  free:   'Gratuito',
  pro:    'Pro',
  clinic: 'Clínica',
}

export default async function AdminProfissionaisPage() {
  const profList = await db
    .select({
      id:          professionals.id,
      displayName: professionals.displayName,
      slug:        professionals.slug,
      plan:        professionals.plan,
      createdAt:   professionals.createdAt,
      email:       users.email,
    })
    .from(professionals)
    .leftJoin(users, eq(professionals.userId, users.id))
    .orderBy(desc(professionals.createdAt))

  const patientCounts = await db
    .select({ professionalId: patients.professionalId, c: count() })
    .from(patients)
    .groupBy(patients.professionalId)

  const appointmentCounts = await db
    .select({ professionalId: appointments.professionalId, c: count() })
    .from(appointments)
    .groupBy(appointments.professionalId)

  const patientMap     = Object.fromEntries(patientCounts.map(r => [r.professionalId, Number(r.c)]))
  const appointmentMap = Object.fromEntries(appointmentCounts.map(r => [r.professionalId, Number(r.c)]))

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Profissionais</h1>
        <p className="text-sm text-muted-foreground mt-1">{profList.length} cadastradas na plataforma</p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Profissional</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Slug</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Clientes</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Agendamentos</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Cadastro</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Plano</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {profList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                  Nenhuma profissional cadastrada.
                </td>
              </tr>
            ) : (
              profList.map(p => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-foreground">{p.displayName}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{p.slug}</td>
                  <td className="px-4 py-3.5 text-center text-foreground font-medium">
                    {patientMap[p.id] ?? 0}
                  </td>
                  <td className="px-4 py-3.5 text-center text-foreground font-medium">
                    {appointmentMap[p.id] ?? 0}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs">
                    {format(p.createdAt, 'dd/MM/yyyy')}
                  </td>
                  <td className="px-5 py-3.5">
                    <PlanSelector
                      professionalId={p.id}
                      currentPlan={p.plan as 'beta' | 'free' | 'pro' | 'clinic'}
                      planLabels={planLabels}
                      planColors={planColors}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
