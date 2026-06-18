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
  const nextUrl = next && next.startsWith('/') ? next : null

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { name: true, image: true, onboardedAt: true },
  })

  if (user?.onboardedAt) redirect(nextUrl ?? '/cliente/inicio')

  return (
    <CadastroForm
      name={user?.name ?? session.user.name ?? ''}
      image={user?.image ?? session.user.image ?? null}
      next={nextUrl ?? undefined}
    />
  )
}
