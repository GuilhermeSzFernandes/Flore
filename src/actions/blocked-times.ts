'use server'

import { auth } from '@/auth'
import { db } from '@/db'
import { blockedTimes, professionals } from '@/db/schema'
import { eq, and, gte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { appDateString } from '@/lib/datetime'

async function getProfessional(userId: string) {
  return db.query.professionals.findFirst({ where: eq(professionals.userId, userId) })
}

export async function addBlockedTime(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false, error: 'Perfil não encontrado' }

  const date      = formData.get('date') as string
  const fullDay   = formData.get('fullDay') === 'true'
  const startTime = fullDay ? null : (formData.get('startTime') as string) || null
  const endTime   = fullDay ? null : (formData.get('endTime') as string) || null
  const reason    = (formData.get('reason') as string)?.trim() || null

  if (!date) return { success: false, error: 'Selecione uma data.' }
  if (!fullDay && (!startTime || !endTime)) return { success: false, error: 'Informe o horário de início e fim.' }
  if (!fullDay && startTime && endTime && startTime >= endTime) {
    return { success: false, error: 'O horário de início deve ser antes do fim.' }
  }

  await db.insert(blockedTimes).values({
    professionalId: professional.id,
    date,
    startTime,
    endTime,
    reason,
  })

  revalidatePath('/servicos')
  return { success: true }
}

export async function removeBlockedTime(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false, error: 'Perfil não encontrado' }

  await db.delete(blockedTimes).where(
    and(eq(blockedTimes.id, id), eq(blockedTimes.professionalId, professional.id))
  )

  revalidatePath('/servicos')
  return { success: true }
}

export async function getUpcomingBlockedTimes(professionalId: string) {
  const today = appDateString()
  return db.query.blockedTimes.findMany({
    where: and(
      eq(blockedTimes.professionalId, professionalId),
      gte(blockedTimes.date, today),
    ),
    orderBy: (t, { asc }) => [asc(t.date), asc(t.startTime)],
  })
}
