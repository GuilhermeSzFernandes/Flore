'use server'

import { auth } from '@/auth'
import { db } from '@/db'
import { feedbackReports } from '@/db/schema'

export async function submitFeedback(description: string, url: string) {
  if (!description.trim()) return { success: false as const, error: 'Descreva o problema.' }

  const session = await auth()

  await db.insert(feedbackReports).values({
    userId:      session?.user?.id ?? null,
    userEmail:   session?.user?.email ?? null,
    userRole:    session?.user?.role ?? null,
    description: description.trim(),
    url:         url || null,
  })

  return { success: true as const }
}
