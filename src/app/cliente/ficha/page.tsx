import { auth } from '@/auth'
import { db } from '@/db'
import { patients, restrictions } from '@/db/schema'
import { eq, and, or, inArray } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { User, AlertTriangle } from 'lucide-react'
import RestricoesClient from './RestricoesClient'

export default async function PerfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const myPatients = await db.query.patients.findMany({
    where: or(
      eq(patients.userId, session.user.id),
      session.user.email ? eq(patients.email, session.user.email) : undefined,
    ),
  })

  const unlinked = myPatients.filter(p => !p.userId)
  if (unlinked.length > 0) {
    await Promise.all(
      unlinked.map(p =>
        db.update(patients).set({ userId: session.user.id }).where(eq(patients.id, p.id)),
      ),
    )
  }

  const patientIds = myPatients.map(p => p.id)

  // Restrições ativas de todos os vínculos, deduplicadas por técnica
  const allRestrictions = patientIds.length
    ? await db.query.restrictions.findMany({
        where: and(
          inArray(restrictions.patientId, patientIds),
          eq(restrictions.active, true),
        ),
      })
    : []

  const seen = new Set<string>()
  const uniqueRestrictions = allRestrictions.filter(r => {
    if (seen.has(r.technique)) return false
    seen.add(r.technique)
    return true
  })

  const patient = myPatients[0] ?? null

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 pb-24 sm:pb-8 space-y-6">
      <h1 className="text-2xl font-display font-semibold" style={{ color: 'oklch(0.155 0.015 155)' }}>
        Meu perfil
      </h1>

      {!patient ? (
        <div className="rounded-xl border p-8 text-center" style={{ borderColor: 'oklch(0.88 0.012 80)', background: 'white' }}>
          <p className="font-medium" style={{ color: 'oklch(0.155 0.015 155)' }}>Perfil não encontrado</p>
          <p className="text-sm mt-1" style={{ color: 'oklch(0.55 0.010 155)' }}>
            Conecte-se a uma profissional para que suas informações apareçam aqui.
          </p>
        </div>
      ) : (
        <>
          {/* Dados pessoais */}
          <div className="rounded-xl border bg-white p-5 space-y-4" style={{ borderColor: 'oklch(0.88 0.012 80)' }}>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" style={{ color: 'oklch(0.575 0.115 27)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'oklch(0.155 0.015 155)' }}>Dados pessoais</h2>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium" style={{ color: 'oklch(0.55 0.010 155)' }}>Nome</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: 'oklch(0.155 0.015 155)' }}>{patient.name}</p>
              </div>
              {patient.phone && (
                <div>
                  <p className="text-xs font-medium" style={{ color: 'oklch(0.55 0.010 155)' }}>Telefone</p>
                  <p className="text-sm mt-0.5" style={{ color: 'oklch(0.25 0.012 155)' }}>{patient.phone}</p>
                </div>
              )}
              {patient.email && (
                <div>
                  <p className="text-xs font-medium" style={{ color: 'oklch(0.55 0.010 155)' }}>E-mail</p>
                  <p className="text-sm mt-0.5" style={{ color: 'oklch(0.25 0.012 155)' }}>{patient.email}</p>
                </div>
              )}
              {patient.birthDate && (
                <div>
                  <p className="text-xs font-medium" style={{ color: 'oklch(0.55 0.010 155)' }}>Data de nascimento</p>
                  <p className="text-sm mt-0.5" style={{ color: 'oklch(0.25 0.012 155)' }}>
                    {format(new Date(patient.birthDate + 'T00:00:00'), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
              {patient.notes && (
                <div className="pt-2 border-t" style={{ borderColor: 'oklch(0.88 0.012 80)' }}>
                  <p className="text-xs font-medium" style={{ color: 'oklch(0.55 0.010 155)' }}>Observações</p>
                  <p className="text-sm mt-0.5" style={{ color: 'oklch(0.25 0.012 155)' }}>{patient.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Restrições */}
          <div className="rounded-xl border bg-white p-5 space-y-4" style={{ borderColor: 'oklch(0.88 0.012 80)' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h2 className="text-sm font-semibold" style={{ color: 'oklch(0.155 0.015 155)' }}>Restrições</h2>
            </div>
            <p className="text-xs" style={{ color: 'oklch(0.60 0.010 155)' }}>
              Técnicas ou procedimentos que devem ser evitados no seu atendimento.
            </p>
            <RestricoesClient activeRestrictions={uniqueRestrictions} />
          </div>
        </>
      )}
    </div>
  )
}
