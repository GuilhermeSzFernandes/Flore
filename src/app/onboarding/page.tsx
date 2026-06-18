import { auth } from '@/auth'
import { db } from '@/db'
import { professionals } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import OnboardingForm from './OnboardingForm'

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const existing = await db.query.professionals.findFirst({
    where: eq(professionals.userId, session.user.id),
  })
  if (existing) redirect('/dashboard')

  return (
    <div className="min-h-screen flex bg-background">
      {/* Coluna marca */}
      <div
        className="hidden lg:flex w-64 shrink-0 flex-col justify-between p-10"
        style={{ background: 'var(--foreground)' }}
      >
        <span className="font-display italic text-2xl" style={{ color: 'var(--primary)' }}>Flore</span>
        <p className="text-sm leading-relaxed font-display italic" style={{ color: 'oklch(0.60 0.02 155)' }}>
          "Cada sessão é um cuidado. Cada registro, uma história."
        </p>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center p-8">
        <OnboardingForm defaultName={session.user.name ?? ''} />
      </div>
    </div>
  )
}
