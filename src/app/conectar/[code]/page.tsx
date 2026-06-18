import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export default async function ConectarPage({ params }: { params: Promise<{ code: string }> }) {
  const { code }  = await params
  const session   = await auth()

  if (!session?.user || session.user.role !== 'patient') {
    redirect(`/login?callbackUrl=/conectar/${code}`)
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { onboardedAt: true },
  })

  // Usuário novo: preserva o código através do onboarding
  if (!dbUser?.onboardedAt) {
    redirect(`/cliente/cadastro?next=${encodeURIComponent(`/cliente/inicio?conectar=${code}`)}`)
  }

  redirect(`/cliente/inicio?conectar=${code}`)
}
