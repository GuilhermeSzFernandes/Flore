'use server'

import { auth } from '@/auth'
import { db } from '@/db'
import { appointments, professionals, patients, restrictions } from '@/db/schema'
import { eq, and, gte, lt, count } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { canCreateAppointment, type Plan } from '@/lib/plan'
import { buildWhatsAppReminderUrl } from '@/lib/whatsapp'

async function getProfessional(userId: string) {
  return db.query.professionals.findFirst({
    where: eq(professionals.userId, userId),
  })
}

export async function sendWhatsAppReminder(appointmentId: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false, error: 'Perfil não encontrado' }

  const appointment = await db.query.appointments.findFirst({
    where: and(
      eq(appointments.id, appointmentId),
      eq(appointments.professionalId, professional.id),
    ),
  })
  if (!appointment) return { success: false, error: 'Agendamento não encontrado' }

  await db
    .update(appointments)
    .set({ reminderSentAt: new Date() })
    .where(eq(appointments.id, appointmentId))

  const url = buildWhatsAppReminderUrl({
    phone:            appointment.patientPhone,
    patientName:      appointment.patientName,
    serviceName:      appointment.serviceName,
    professionalName: professional.displayName,
    startsAt:         appointment.startsAt,
  })

  revalidatePath('/dashboard')
  return { success: true, url }
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'scheduled' | 'confirmed' | 'done' | 'no_show' | 'cancelled',
) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false, error: 'Perfil não encontrado' }

  await db
    .update(appointments)
    .set({ status })
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(appointments.professionalId, professional.id),
      ),
    )

  revalidatePath('/dashboard')
  revalidatePath('/agenda')
  return { success: true }
}

export async function createAppointment(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false, error: 'Perfil não encontrado' }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const [{ value: usedThisMonth }] = await db
    .select({ value: count() })
    .from(appointments)
    .where(
      and(
        eq(appointments.professionalId, professional.id),
        gte(appointments.startsAt, monthStart),
        lt(appointments.startsAt, monthEnd),
      ),
    )

  if (!canCreateAppointment(professional.plan as Plan, usedThisMonth)) {
    return { success: false, error: 'Limite de agendamentos do mês atingido' }
  }

  const patientId = formData.get('patientId') as string | null
  const patientName = formData.get('patientName') as string
  const patientPhone = formData.get('patientPhone') as string
  const serviceName = formData.get('serviceName') as string
  const startsAt = new Date(formData.get('startsAt') as string)
  const durationMin = parseInt(formData.get('durationMin') as string) || 60
  const notes = formData.get('notes') as string | null

  if (!patientName || !patientPhone || !serviceName || isNaN(startsAt.getTime())) {
    return { success: false, error: 'Dados obrigatórios ausentes' }
  }

  let resolvedPatientId: string | null = patientId || null

  if (patientId) {
    const patient = await db.query.patients.findFirst({
      where: and(
        eq(patients.id, patientId),
        eq(patients.professionalId, professional.id),
      ),
    })
    if (patient) {
      resolvedPatientId = patient.id
    }
  }

  await db.insert(appointments).values({
    professionalId: professional.id,
    patientId:      resolvedPatientId,
    patientName,
    patientPhone:   patientPhone.replace(/\D/g, ''),
    serviceName,
    startsAt,
    durationMin,
    notes:          notes || null,
    status:         'scheduled',
  })

  revalidatePath('/agenda')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getAppointmentWithRestrictions(appointmentId: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const professional = await getProfessional(session.user.id)
  if (!professional) return null

  const appointment = await db.query.appointments.findFirst({
    where: and(
      eq(appointments.id, appointmentId),
      eq(appointments.professionalId, professional.id),
    ),
  })
  if (!appointment) return null

  let activeRestrictions: typeof restrictions.$inferSelect[] = []
  if (appointment.patientId) {
    activeRestrictions = await db.query.restrictions.findMany({
      where: and(
        eq(restrictions.patientId, appointment.patientId),
        eq(restrictions.active, true),
      ),
    })
  }

  return { appointment, restrictions: activeRestrictions }
}
