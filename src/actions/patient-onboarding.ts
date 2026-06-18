'use server'

import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export async function completePatientOnboarding(next?: string) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  await db
    .update(users)
    .set({ onboardedAt: new Date() })
    .where(eq(users.id, session.user.id))

  redirect(next && next.startsWith('/') ? next : '/cliente/inicio')
}
