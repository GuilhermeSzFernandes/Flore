import { db } from '@/db'
import { professionals, services, appointments } from '@/db/schema'
import { eq, and, gte, lt, count } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { startOfMonth, endOfMonth } from 'date-fns'
import { canCreateAppointment, type Plan } from '@/lib/plan'
import { nowInApp } from '@/lib/datetime'
import { auth } from '@/auth'
import { ensurePatientLink } from '@/actions/public-booking'
import PublicBookingForm from './PublicBookingForm'
import ProfileVitrine from './ProfileVitrine'

export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const professional = await db.query.professionals.findFirst({
    where: eq(professionals.slug, slug),
  })
  if (!professional) notFound()

  const now        = nowInApp()
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

  // Verifica sessão da paciente: se logada, já entra vinculada a este
  // profissional (reaproveitando nome/telefone do cadastro) sem repetir formulário.
  const session = await auth()
  let patient: { id: string; name: string; phone: string } | null = null

  if (session?.user?.role === 'patient') {
    patient = await ensurePatientLink(professional.id)
  }

  const vitrine = (
    <ProfileVitrine
      professional={{
        displayName:         professional.displayName,
        businessName:        professional.businessName,
        businessDescription: professional.businessDescription,
        address:             professional.address,
        specialty:           professional.specialty,
        workingHours:        professional.workingHours,
        avatarUrl:           professional.avatarUrl,
        galleryUrls:         professional.galleryUrls,
      }}
      services={activeServices}
    />
  )

  return (
    <div style={{ background: 'oklch(0.963 0.006 80)' }}>
      {vitrine}

      <section id="agendar" className="scroll-mt-4">
        {atLimit ? (
          <div className="flex items-center justify-center p-6 pb-20">
            <div className="max-w-sm rounded-2xl border bg-white p-8 text-center shadow-sm" style={{ borderColor: 'oklch(0.88 0.012 80)' }}>
              <div className="mb-4 text-3xl">🌸</div>
              <h2 className="mb-2 font-display text-xl italic" style={{ color: 'oklch(0.155 0.015 155)' }}>
                Agenda temporariamente cheia
              </h2>
              <p className="text-sm" style={{ color: 'oklch(0.50 0.010 155)' }}>
                Todos os horários deste mês já foram reservados. Fale diretamente comigo para verificar uma vaga.
              </p>
              {professional.phone && (
                <a
                  href={`https://wa.me/55${professional.phone}`}
                  className="mt-5 inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contatar pelo WhatsApp
                </a>
              )}
            </div>
          </div>
        ) : (
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
        )}
      </section>
    </div>
  )
}
