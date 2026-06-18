'use server'

import { auth } from '@/auth'
import { db } from '@/db'
import { professionals } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

type Plan = 'beta' | 'free' | 'pro' | 'clinic'

export async function changeProfessionalPlan(professionalId: string, plan: Plan) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return { success: false, error: 'Não autorizado' }
  }

  await db.update(professionals)
    .set({ plan })
    .where(eq(professionals.id, professionalId))

  revalidatePath('/admin/profissionais')
  return { success: true }
}
