import { auth } from '@/auth'
import { db } from '@/db'
import { patients, professionals, appointments } from '@/db/schema'
import { eq, and, count, ilike, or, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlanLimitBanner } from '@/components/PlanLimitBanner'
import { canAddPatient, type Plan } from '@/lib/plan'
import { UserPlus, Phone, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page: pageParam } = await searchParams
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const professional = await db.query.professionals.findFirst({
    where: eq(professionals.userId, session.user.id),
  })
  if (!professional) redirect('/onboarding')

  const page = Math.max(1, parseInt(pageParam ?? '1') || 1)
  const offset = (page - 1) * PAGE_SIZE

  const baseWhere = eq(patients.professionalId, professional.id)
  const searchWhere = q
    ? and(baseWhere, or(ilike(patients.name, `%${q}%`), ilike(patients.phone, `%${q.replace(/\D/g, '')}%`)))
    : baseWhere

  const [allPatients, [{ total }]] = await Promise.all([
    db.query.patients.findMany({ where: searchWhere, limit: PAGE_SIZE, offset, orderBy: (t, { asc }) => [asc(t.name)] }),
    db.select({ total: count() }).from(patients).where(eq(patients.professionalId, professional.id)),
  ])

  const atLimit = !canAddPatient(professional.plan as Plan, total)

  const clientsWithStats = await Promise.all(
    allPatients.map(async (p) => {
      const [{ sessions }] = await db
        .select({ sessions: count() })
        .from(appointments)
        .where(and(eq(appointments.patientId, p.id), sql`${appointments.status} = 'done'`))

      const lastAppt = await db.query.appointments.findFirst({
        where: and(eq(appointments.patientId, p.id), sql`${appointments.status} = 'done'`),
        orderBy: (t, { desc }) => [desc(t.startsAt)],
      })

      return { client: p, sessions, lastSession: lastAppt?.startsAt ?? null }
    }),
  )

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
            Seus clientes
          </p>
          <h1 className="text-3xl font-display font-semibold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} cadastrados</p>
        </div>
        <Link
          href="/clientes/novo"
          className={cn(
            buttonVariants({ variant: 'default' }),
            'gap-2',
            atLimit && 'pointer-events-none opacity-40',
          )}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Novo cliente
        </Link>
      </div>

      {atLimit && (
        <div className="mb-5">
          <PlanLimitBanner feature="pacientes" currentPlan={professional.plan as Plan} />
        </div>
      )}

      {/* Busca */}
      <form className="mb-5">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou telefone..."
          className="max-w-xs h-9 text-sm"
        />
      </form>

      {/* Lista */}
      <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-card">
        {clientsWithStats.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {q ? 'Nenhum cliente encontrado para essa busca.' : 'Nenhum cliente cadastrado ainda.'}
          </div>
        ) : (
          clientsWithStats.map(({ client, sessions, lastSession }) => (
            <Link
              key={client.id}
              href={`/clientes/${client.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/60 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{client.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" />
                  {client.phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-foreground">{sessions} sessões</p>
                {lastSession && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(lastSession, "d 'de' MMM", { locale: ptBR })}
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
            </Link>
          ))
        )}
      </div>

      {/* Paginação */}
      {total > PAGE_SIZE && (
        <div className="flex justify-center gap-2 mt-6 items-center">
          {page > 1 && (
            <Link href={`/clientes?q=${q ?? ''}&page=${page - 1}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              ← Anterior
            </Link>
          )}
          <span className="text-xs text-muted-foreground">
            {page} / {Math.ceil(total / PAGE_SIZE)}
          </span>
          {page * PAGE_SIZE < total && (
            <Link href={`/clientes?q=${q ?? ''}&page=${page + 1}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Próxima →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
