import { db } from '@/db'
import { professionals, services, appointments, patients } from '@/db/schema'
import { eq, and, gte, lt, count, or } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { startOfMonth, endOfMonth } from 'date-fns'
import { canCreateAppointment, type Plan } from '@/lib/plan'
import { auth } from '@/auth'
import PublicBookingForm from './PublicBookingForm'

export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const professional = await db.query.professionals.findFirst({
    where: eq(professionals.slug, slug),
  })
  if (!professional) notFound()

  const now        = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd   = endOfMonth(now)

  const [{ usedThisMonth }] = await db
    .select({ usedThisMonth: count() })
    .from(appointments)
    .where(
      and(
        eq(appointments.professionalId, professional.id),
        gte(appointments.startsAt, monthStart),
        lt(appointments.startsAt, monthEnd),
      ),
    )

  const atLimit = !canCreateAppointment(professional.plan as Plan, usedThisMonth)

  const activeServices = await db.query.services.findMany({
    where: and(
      eq(services.professionalId, professional.id),
      eq(services.active, true),
    ),
    orderBy: (t, { asc }) => [asc(t.name)],
  })

  const existingAppointments = await db.query.appointments.findMany({
    where: and(
      eq(appointments.professionalId, professional.id),
      gte(appointments.startsAt, now),
    ),
    columns: { startsAt: true, durationMin: true },
  })

  // Verifica sessão da paciente e busca cadastro
  const session = await auth()
  let patient: { id: string; name: string; phone: string } | null = null

  if (session?.user?.role === 'patient') {
    const conditions = []
    if (session.user.id)    conditions.push(eq(patients.userId, session.user.id))
    if (session.user.email) conditions.push(eq(patients.email, session.user.email))

    if (conditions.length > 0) {
      const found = await db.query.patients.findFirst({
        where: and(
          eq(patients.professionalId, professional.id),
          or(...conditions as [typeof conditions[0], ...typeof conditions]),
        ),
        columns: { id: true, name: true, phone: true },
      })
      patient = found ?? null
    }
  }

  if (atLimit) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'oklch(0.963 0.006 80)' }}>
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm text-center">
          <div className="text-3xl mb-4">🌸</div>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'oklch(0.155 0.015 155)' }}>{professional.displayName}</h1>
          <p style={{ color: 'oklch(0.50 0.010 155)' }}>
            Esta agenda está temporariamente indisponível. Entre em contato diretamente com a profissional.
          </p>
          {professional.phone && (
            <a
              href={`https://wa.me/55${professional.phone}`}
              className="inline-block mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contatar pelo WhatsApp
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <PublicBookingForm
      professional={{ id: professional.id, displayName: professional.displayName, slug }}
      services={activeServices}
      existingAppointments={existingAppointments}
      patient={patient}
      isLoggedIn={session?.user?.role === 'patient'}
      sessionUser={session?.user?.role === 'patient' ? {
        name:  session.user.name  ?? '',
        email: session.user.email ?? '',
      } : null}
    />
  )
}
