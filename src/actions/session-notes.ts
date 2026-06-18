'use server'

import { auth } from '@/auth'
import { db } from '@/db'
import { sessionNotes, appointments, professionals } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function createSessionNote(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const professional = await db.query.professionals.findFirst({
    where: eq(professionals.userId, session.user.id),
  })
  if (!professional) return { success: false, error: 'Perfil não encontrado' }

  const appointmentId = formData.get('appointmentId') as string
  const whatWasDone = formData.get('whatWasDone') as string
  const areasTreated = formData.getAll('areasTreated') as string[]
  const painBefore = parseInt(formData.get('painBefore') as string)
  const painAfter = parseInt(formData.get('painAfter') as string)
  const observations = formData.get('observations') as string | null
  const nextSessionTip = formData.get('nextSessionTip') as string | null

  if (!whatWasDone?.trim()) return { success: false, error: 'Descreva o que foi feito' }

  const appointment = await db.query.appointments.findFirst({
    where: and(
      eq(appointments.id, appointmentId),
      eq(appointments.professionalId, professional.id),
    ),
  })
  if (!appointment) return { success: false, error: 'Agendamento não encontrado' }

  await db.insert(sessionNotes).values({
    appointmentId,
    whatWasDone:    whatWasDone.trim(),
    areasTreated:   areasTreated.length > 0 ? areasTreated : null,
    painBefore:     isNaN(painBefore) ? null : painBefore,
    painAfter:      isNaN(painAfter) ? null : painAfter,
    observations:   observations?.trim() || null,
    nextSessionTip: nextSessionTip?.trim() || null,
  })

  await db
    .update(appointments)
    .set({ status: 'done' })
    .where(eq(appointments.id, appointmentId))

  revalidatePath('/agenda')
  revalidatePath('/dashboard')
  return { success: true }
}
