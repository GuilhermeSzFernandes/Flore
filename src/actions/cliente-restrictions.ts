'use server'

import { auth } from '@/auth'
import { db } from '@/db'
import { patients, restrictions } from '@/db/schema'
import { eq, or, and, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

async function getMyPatientIds(userId: string, email: string | null | undefined): Promise<string[]> {
  const conditions = [eq(patients.userId, userId)]
  if (email) conditions.push(eq(patients.email, email))
  const rows = await db.query.patients.findMany({
    where: or(...(conditions as [typeof conditions[0], ...typeof conditions])),
    columns: { id: true },
  })
  return rows.map(r => r.id)
}

export async function addClientRestriction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'patient') {
    return { success: false as const, error: 'Não autenticado' }
  }

  const technique = (formData.get('technique') as string)?.trim()
  const reason    = (formData.get('reason') as string)?.trim() || null
  if (!technique) return { success: false as const, error: 'Informe a técnica' }

  const ids = await getMyPatientIds(session.user.id, session.user.email)
  if (ids.length === 0) return { success: false as const, error: 'Perfil não encontrado' }

  await Promise.all(ids.map(patientId =>
    db.insert(restrictions).values({ patientId, technique, reason, active: true })
  ))

  revalidatePath('/cliente/ficha')
  return { success: true as const }
}

// Desativa pelo nome da técnica em todos os registros do cliente
export async function deactivateClientRestriction(technique: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'patient') {
    return { success: false as const, error: 'Não autenticado' }
  }

  const ids = await getMyPatientIds(session.user.id, session.user.email)
  if (ids.length === 0) return { success: false as const, error: 'Perfil não encontrado' }

  await db
    .update(restrictions)
    .set({ active: false })
    .where(and(
      inArray(restrictions.patientId, ids),
      eq(restrictions.technique, technique),
      eq(restrictions.active, true),
    ))

  revalidatePath('/cliente/ficha')
  return { success: true as const }
}
