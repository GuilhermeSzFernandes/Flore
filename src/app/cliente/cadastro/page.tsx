import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import CadastroForm from './CadastroForm'

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'patient') redirect('/dashboard')

  const { next } = await searchParams
  // Aceita apenas URLs internas por segurança
  const nextUrl = next && next.startsWith('/') ? next : null

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { name: true, image: true, onboardedAt: true },
  })

  // Já passou pelo onboarding → vai para o destino ou início
  if (user?.onboardedAt) {
    redirect(nextUrl ?? '/cliente/inicio')
  }

  // Vem de um link de agendamento → marca como onboarded automaticamente e
  // volta para a página do profissional (o "Primeiro acesso" lá coleta nome+telefone)
  if (nextUrl?.startsWith('/agendar/')) {
    await db
      .update(users)
      .set({ onboardedAt: new Date() })
      .where(eq(users.id, session.user.id))
    redirect(nextUrl)
  }

  // Fluxo normal (login pela home) → exibe tela de boas-vindas
  return (
    <CadastroForm
      name={user?.name ?? session.user.name ?? ''}
      image={user?.image ?? session.user.image ?? null}
      next={nextUrl ?? undefined}
    />
  )
}
