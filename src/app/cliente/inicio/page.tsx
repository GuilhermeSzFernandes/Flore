import { auth } from '@/auth'
import { db } from '@/db'
import { patients, appointments, professionals, sessionNotes } from '@/db/schema'
import { eq, and, inArray, gte, asc, desc, or } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import InicioClient from './InicioClient'

export default async function ClienteInicioPage({
  searchParams,
}: {
  searchParams: Promise<{ conectar?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { conectar } = await searchParams

  // Todos os registros do paciente vinculados a esta conta
  const myPatients = await db.query.patients.findMany({
    where: or(
      eq(patients.userId, session.user.id),
      session.user.email ? eq(patients.email, session.user.email) : undefined,
    ),
  })

  // Vincular userId nos registros que ainda não têm
  const unlinked = myPatients.filter(p => !p.userId)
  if (unlinked.length > 0) {
    await Promise.all(
      unlinked.map(p =>
        db.update(patients).set({ userId: session.user.id }).where(eq(patients.id, p.id)),
      ),
    )
  }

  const patientIds = myPatients.map(p => p.id)
  const now = new Date()

  const [upcomingAppointments, pastAppointments] = patientIds.length
    ? await Promise.all([
        db
          .select({
            id:               appointments.id,
            serviceName:      appointments.serviceName,
            startsAt:         appointments.startsAt,
            durationMin:      appointments.durationMin,
            status:           appointments.status,
            professionalName: professionals.displayName,
            professionalSlug: professionals.slug,
          })
          .from(appointments)
          .leftJoin(professionals, eq(appointments.professionalId, professionals.id))
          .where(and(
            inArray(appointments.patientId, patientIds),
            inArray(appointments.status, ['scheduled', 'confirmed']),
            gte(appointments.startsAt, now),
          ))
          .orderBy(asc(appointments.startsAt))
          .limit(5),

        db
          .select({
            id:               appointments.id,
            serviceName:      appointments.serviceName,
            startsAt:         appointments.startsAt,
            durationMin:      appointments.durationMin,
            status:           appointments.status,
            professionalName: professionals.displayName,
          })
          .from(appointments)
          .leftJoin(professionals, eq(appointments.professionalId, professionals.id))
          .where(and(
            inArray(appointments.patientId, patientIds),
            inArray(appointments.status, ['done', 'no_show', 'cancelled']),
          ))
          .orderBy(desc(appointments.startsAt))
          .limit(30),
      ])
    : [[], []]

  const doneIds = pastAppointments.filter(a => a.status === 'done').map(a => a.id)
  const notes = doneIds.length
    ? await db.query.sessionNotes.findMany({ where: inArray(sessionNotes.appointmentId, doneIds) })
    : []
  const notesByApt = Object.fromEntries(notes.map(n => [n.appointmentId, n]))

  // Profissionais únicas com as quais o cliente está conectado
  const connectedProfessionals = patientIds.length
    ? await db
        .select({
          id:           professionals.id,
          displayName:  professionals.displayName,
          businessName: professionals.businessName,
          address:      professionals.address,
          slug:         professionals.slug,
        })
        .from(patients)
        .innerJoin(professionals, eq(patients.professionalId, professionals.id))
        .where(inArray(patients.id, patientIds))
    : []

  const firstName = (myPatients[0]?.name ?? session.user.name ?? '').split(' ')[0]

  return (
    <InicioClient
      firstName={firstName}
      upcomingAppointments={upcomingAppointments}
      pastAppointments={pastAppointments}
      notesByApt={notesByApt}
      professionals={connectedProfessionals}
      initialCode={conectar ?? ''}
    />
  )
}
