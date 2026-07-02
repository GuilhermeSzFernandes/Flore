import { db } from '@/db'
import { professionals, users } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toAppTz } from '@/lib/datetime'
import ReferralList, { type ReferrerRow, type ReferredPro } from './ReferralList'

const fmtDate = (d: Date) => format(toAppTz(d), 'dd/MM/yy', { locale: ptBR })

export default async function AdminIndicacoesPage() {
  const allPros = await db
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
    .orderBy(desc(professionals.createdAt))

  // Agrupa indicados por quem indicou
  const childrenMap: Record<string, ReferredPro[]> = {}
  for (const p of allPros) {
    if (!p.referredById) continue
    ;(childrenMap[p.referredById] ??= []).push({
      id: p.id,
      name: p.businessName ?? p.displayName,
      email: p.email,
      plan: p.plan,
      createdAtLabel: fmtDate(p.createdAt),
    })
  }

  const rows: ReferrerRow[] = allPros.map((p) => {
    const referred = childrenMap[p.id] ?? []
    return {
      id: p.id,
      name: p.businessName ?? p.displayName,
      email: p.email,
      plan: p.plan,
      referralCode: p.referralCode,
      createdAtLabel: fmtDate(p.createdAt),
      count: referred.length,
      referred,
    }
  })

  // Ordena: quem tem mais indicações aparece primeiro
  rows.sort((a, b) => b.count - a.count)

  const totalReferrals = rows.reduce((s, r) => s + r.count, 0)
  const withReferrals = rows.filter((r) => r.count > 0).length

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Indicações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Marketing orgânico beta — {totalReferrals} cadastro{totalReferrals !== 1 ? 's' : ''} via indicação · {withReferrals} profissional{withReferrals !== 1 ? 'is' : ''} com indicados
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Clique em uma profissional com indicações para ver quem ela trouxe.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <ReferralList rows={rows} />
      </div>
    </div>
  )
}
