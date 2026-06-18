'use server'

import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export async function completePatientOnboarding(formData: FormData, next?: string) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const name  = (formData.get('name')  as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim().replace(/\D/g, '')

  if (!name || !phone) return { success: false as const, error: 'Preencha nome e telefone.' }

  await db
    .update(users)
    .set({ name, phone, onboardedAt: new Date() })
    .where(eq(users.id, session.user.id))

  redirect(next && next.startsWith('/') ? next : '/cliente/inicio')
}
