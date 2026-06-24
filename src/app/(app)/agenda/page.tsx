import { auth } from '@/auth'
import { db } from '@/db'
import { appointments, professionals, patients, restrictions, services } from '@/db/schema'
import { eq, and, gte, lt } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, addDays, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import AgendaClient from './AgendaClient'

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>
}) {
  const { view = 'day', date: dateParam } = await searchParams
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const professional = await db.query.professionals.findFirst({
    where: eq(professionals.userId, session.user.id),
  })
  if (!professional) redirect('/onboarding')

  const selectedDate = dateParam ? parseISO(dateParam) : new Date()

  const rangeStart = view === 'week'
    ? startOfWeek(selectedDate, { weekStartsOn: 0 })
    : startOfDay(selectedDate)

  const rangeEnd = view === 'week'
    ? endOfWeek(selectedDate, { weekStartsOn: 0 })
    : endOfDay(selectedDate)

  const dayAppointments = await db.query.appointments.findMany({
    where: and(
      eq(appointments.professionalId, professional.id),
      gte(appointments.startsAt, rangeStart),
      lt(appointments.startsAt, rangeEnd),
    ),
    orderBy: (t, { asc }) => [asc(t.startsAt)],
  })

  const appointmentsWithRestrictions = await Promise.all(
    dayAppointments.map(async (apt) => {
      if (!apt.patientId) return { ...apt, restrictions: [] }
      const activeRestrictions = await db.query.restrictions.findMany({
        where: and(
          eq(restrictions.patientId, apt.patientId),
          eq(restrictions.active, true),
        ),
      })
      return { ...apt, restrictions: activeRestrictions }
    }),
  )

  const activeServices = await db.query.services.findMany({
    where: and(eq(services.professionalId, professional.id), eq(services.active, true)),
    orderBy: (t, { asc }) => [asc(t.name)],
  })

  const allPatients = await db.query.patients.findMany({
    where: eq(patients.professionalId, professional.id),
    orderBy: (t, { asc }) => [asc(t.name)],
  })

  return (
    <AgendaClient
      appointments={appointmentsWithRestrictions}
      services={activeServices}
      patients={allPatients}
      professional={{ id: professional.id, displayName: professional.displayName, specialty: professional.specialty ?? 'other' }}
      view={view as 'day' | 'week'}
      selectedDate={selectedDate.toISOString()}
    />
  )
}
