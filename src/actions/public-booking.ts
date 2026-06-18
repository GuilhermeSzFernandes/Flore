'use server'

import { auth } from '@/auth'
import { db } from '@/db'
import { appointments, patients, professionals, services, users } from '@/db/schema'
import { eq, and, gte, lt, count, or } from 'drizzle-orm'
import { startOfMonth, endOfMonth } from 'date-fns'
import { canCreateAppointment, canAddPatient, type Plan } from '@/lib/plan'

async function getPatientForSession(
  professionalId: string,
  userId: string | undefined,
  email: string | undefined,
) {
  const conditions: ReturnType<typeof eq>[] = []
  if (userId) conditions.push(eq(patients.userId, userId))
  if (email)  conditions.push(eq(patients.email, email))
  if (conditions.length === 0) return null

  return db.query.patients.findFirst({
    where: and(
      eq(patients.professionalId, professionalId),
      or(...(conditions as [ReturnType<typeof eq>, ...ReturnType<typeof eq>[]])),
    ),
  }) ?? null
}

export async function registerPatient(formData: FormData) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'patient') {
    return { success: false as const, error: 'Você precisa estar logada para se cadastrar.' }
  }

  const professionalId = formData.get('professionalId') as string
  const name           = (formData.get('name') as string)?.trim()
  const phone          = (formData.get('phone') as string)?.trim()

  if (!name || !phone) {
    return { success: false as const, error: 'Preencha todos os campos obrigatórios.' }
  }

  const professional = await db.query.professionals.findFirst({
    where: eq(professionals.id, professionalId),
  })
  if (!professional) return { success: false as const, error: 'Profissional não encontrada.' }

  // Já está cadastrada?
  const existing = await getPatientForSession(professionalId, session.user.id, session.user.email ?? undefined)
  if (existing) {
    return { success: true as const, patient: { id: existing.id, name: existing.name, phone: existing.phone } }
  }

  // Verificar limite do plano
  const [{ total }] = await db
    .select({ total: count() })
    .from(patients)
    .where(eq(patients.professionalId, professionalId))

  if (!canAddPatient(professional.plan as Plan, Number(total))) {
    return { success: false as const, error: 'Esta profissional atingiu o limite de clientes no momento.' }
  }

  const [created] = await db
    .insert(patients)
    .values({
      professionalId,
      userId: session.user.id ?? null,
      name,
      phone:  phone.replace(/\D/g, ''),
      email:  session.user.email ?? null,
    })
    .returning({ id: patients.id, name: patients.name, phone: patients.phone })

  // Marca o onboarding como concluído para quem chegou pelo link de agendamento
  if (session.user.id) {
    await db
      .update(users)
      .set({ onboardedAt: new Date() })
      .where(eq(users.id, session.user.id))
  }

  return { success: true as const, patient: created }
}

export async function createPublicAppointment(formData: FormData) {
  const session = await auth()

  if (!session?.user || session.user.role !== 'patient') {
    return { success: false, error: 'Você precisa estar logada para agendar.' }
  }

  const professionalId = formData.get('professionalId') as string
  const serviceName    = formData.get('serviceName') as string
  const startsAtStr    = formData.get('startsAt') as string
  const notes          = formData.get('notes') as string | null

  if (!serviceName || !startsAtStr) {
    return { success: false, error: 'Preencha todos os campos obrigatórios.' }
  }

  const professional = await db.query.professionals.findFirst({
    where: eq(professionals.id, professionalId),
  })
  if (!professional) return { success: false, error: 'Profissional não encontrada.' }

  const patient = await getPatientForSession(professionalId, session.user.id, session.user.email ?? undefined)
  if (!patient) {
    return { success: false, error: 'Você não está cadastrada com esta profissional.' }
  }

  const now        = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd   = endOfMonth(now)

  const [{ used }] = await db
    .select({ used: count() })
    .from(appointments)
    .where(
      and(
        eq(appointments.professionalId, professionalId),
        gte(appointments.startsAt, monthStart),
        lt(appointments.startsAt, monthEnd),
      ),
    )

  if (!canCreateAppointment(professional.plan as Plan, used)) {
    return { success: false, error: 'Agenda indisponível no momento.' }
  }

  const startsAt = new Date(startsAtStr)
  if (isNaN(startsAt.getTime())) return { success: false, error: 'Data inválida.' }

  const service = await db.query.services.findFirst({
    where: and(
      eq(services.professionalId, professionalId),
      eq(services.name, serviceName),
      eq(services.active, true),
    ),
  })

  await db.insert(appointments).values({
    professionalId,
    patientId:    patient.id,
    patientName:  patient.name,
    patientPhone: patient.phone,
    serviceName,
    startsAt,
    durationMin:  service?.durationMin ?? 60,
    notes:        notes?.trim() || null,
    status:       'scheduled',
  })

  return { success: true }
}
