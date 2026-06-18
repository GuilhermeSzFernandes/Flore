import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function ConectarPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const session  = await auth()

  if (!session?.user || session.user.role !== 'patient') {
    redirect(`/login?callbackUrl=/conectar/${code}`)
  }

  redirect(`/cliente/inicio?conectar=${code}`)
}
