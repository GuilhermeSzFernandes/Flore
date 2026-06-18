'use server'

import { auth } from '@/auth'
import { db } from '@/db'
import { patients, professionals, restrictions } from '@/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canAddPatient, type Plan } from '@/lib/plan'

async function getProfessional(userId: string) {
  return db.query.professionals.findFirst({
    where: eq(professionals.userId, userId),
  })
}

export async function createClient(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false, error: 'Perfil não encontrado' }

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(patients)
    .where(eq(patients.professionalId, professional.id))

  if (!canAddPatient(professional.plan as Plan, total)) {
    return { success: false, error: 'Limite de clientes do plano atingido' }
  }

  const name      = formData.get('name') as string
  const phone     = formData.get('phone') as string
  const email     = formData.get('email') as string | null
  const birthDate = formData.get('birthDate') as string | null
  const notes     = formData.get('notes') as string | null

  if (!name?.trim())  return { success: false, error: 'Nome é obrigatório' }
  if (!phone?.trim()) return { success: false, error: 'Telefone é obrigatório' }

  const [inserted] = await db.insert(patients).values({
    professionalId: professional.id,
    name:           name.trim(),
    phone:          phone.replace(/\D/g, ''),
    email:          email?.trim() || null,
    birthDate:      birthDate || null,
    notes:          notes?.trim() || null,
  }).returning()

  revalidatePath('/clientes')
  redirect(`/clientes/${inserted.id}`)
}

export async function updateClient(clientId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false, error: 'Perfil não encontrado' }

  const client = await db.query.patients.findFirst({
    where: and(
      eq(patients.id, clientId),
      eq(patients.professionalId, professional.id),
    ),
  })
  if (!client) return { success: false, error: 'Cliente não encontrado' }

  const name  = formData.get('name') as string
  const phone = formData.get('phone') as string

  await db
    .update(patients)
    .set({
      name:      name?.trim() || client.name,
      phone:     phone?.replace(/\D/g, '') || client.phone,
      email:     (formData.get('email') as string)?.trim() || null,
      birthDate: (formData.get('birthDate') as string) || null,
      notes:     (formData.get('notes') as string)?.trim() || null,
    })
    .where(eq(patients.id, clientId))

  revalidatePath(`/clientes/${clientId}`)
  return { success: true }
}

export async function updateSensitivities(clientId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false, error: 'Perfil não encontrado' }

  const client = await db.query.patients.findFirst({
    where: and(
      eq(patients.id, clientId),
      eq(patients.professionalId, professional.id),
    ),
  })
  if (!client) return { success: false, error: 'Cliente não encontrado' }

  await db
    .update(patients)
    .set({ sensitivities: (formData.get('sensitivities') as string)?.trim() || null })
    .where(eq(patients.id, clientId))

  revalidatePath(`/clientes/${clientId}`)
  return { success: true }
}

export async function addRestriction(clientId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false, error: 'Perfil não encontrado' }

  const client = await db.query.patients.findFirst({
    where: and(
      eq(patients.id, clientId),
      eq(patients.professionalId, professional.id),
    ),
  })
  if (!client) return { success: false, error: 'Cliente não encontrado' }

  const technique = formData.get('technique') as string
  if (!technique?.trim()) return { success: false, error: 'Técnica é obrigatória' }

  await db.insert(restrictions).values({
    patientId: clientId,
    technique: technique.trim(),
    reason:    (formData.get('reason') as string)?.trim() || null,
    active:    true,
  })

  revalidatePath(`/clientes/${clientId}`)
  return { success: true }
}

export async function deactivateRestriction(restrictionId: string, clientId: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  await db
    .update(restrictions)
    .set({ active: false })
    .where(eq(restrictions.id, restrictionId))

  revalidatePath(`/clientes/${clientId}`)
  return { success: true }
}
