import { db } from '@/db'
import { professionals, users } from '@/db/schema'
import { eq, count, desc, isNotNull } from 'drizzle-orm'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Users } from 'lucide-react'

const planColors: Record<string, string> = {
  beta:   'bg-violet-100 text-violet-700',
  free:   'bg-zinc-100 text-zinc-600',
  pro:    'bg-emerald-100 text-emerald-700',
  clinic: 'bg-blue-100 text-blue-700',
}
const planLabels: Record<string, string> = {
  beta: 'Beta', free: 'Gratuito', pro: 'Pro', clinic: 'Clínica',
}

export default async function AdminIndicacoesPage() {
  const [allPros, referralRows] = await Promise.all([
    // Todos os profissionais
    db
      .select({
        id:           professionals.id,
        displayName:  professionals.displayName,
        businessName: professionals.businessName,
        plan:         professionals.plan,
        referralCode: professionals.referralCode,
        referredById: professionals.referredById,
        createdAt:    professionals.createdAt,
        email:        users.email,
      })
      .from(professionals)
      .leftJoin(users, eq(professionals.userId, users.id))
      .orderBy(desc(professionals.createdAt)),

    // Contagem de indicados por referrer
    db
      .select({ referredById: professionals.referredById, total: count() })
      .from(professionals)
      .where(isNotNull(professionals.referredById))
      .groupBy(professionals.referredById),
  ])

  const countMap: Record<string, number> = {}
  for (const r of referralRows) {
    if (r.referredById) countMap[r.referredById] = Number(r.total)
  }

  // Ordena: quem tem mais indicações aparece primeiro
  const sorted = [...allPros].sort((a, b) => (countMap[b.id] ?? 0) - (countMap[a.id] ?? 0))

  const totalReferrals = referralRows.reduce((s, r) => s + Number(r.total), 0)
  const withReferrals  = referralRows.length

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Indicações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Marketing orgânico beta — {totalReferrals} cadastro{totalReferrals !== 1 ? 's' : ''} via indicação · {withReferrals} profissional{withReferrals !== 1 ? 'is' : ''} com indicados
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          {sorted.length === 0 ? (
            <div className="p-12 flex flex-col items-center gap-3 text-center">
              <Users className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhuma profissional cadastrada ainda.</p>
            </div>
          ) : (
            sorted.map(pro => {
              const n = countMap[pro.id] ?? 0
              return (
                <div key={pro.id} className="flex items-center gap-4 px-5 py-4">
                  {/* Contador */}
                  <div
                    className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
                    style={{ background: n > 0 ? 'oklch(0.575 0.115 27 / 10%)' : 'oklch(0.963 0.006 80)' }}
                  >
                    <span
                      className="text-lg font-bold leading-none"
                      style={{ color: n > 0 ? 'oklch(0.575 0.115 27)' : 'oklch(0.65 0.010 155)' }}
                    >
                      {n}
                    </span>
                    <span className="text-[9px] text-muted-foreground mt-0.5">
                      {n === 1 ? 'indicada' : 'indicadas'}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">
                        {pro.businessName ?? pro.displayName}
                      </p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${planColors[pro.plan]}`}>
                        {planLabels[pro.plan]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{pro.email}</p>
                  </div>

                  {/* Código + data */}
                  <div className="text-right shrink-0">
                    <p className="font-mono text-xs font-semibold text-foreground tracking-wider">
                      {pro.referralCode ?? '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(pro.createdAt, 'dd/MM/yy', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
