'use server'

import { auth } from '@/auth'
import { db } from '@/db'
import { appointments, patients, professionals, restrictions, services, blockedTimes } from '@/db/schema'
import { eq, and, gte, lt, count, or } from 'drizzle-orm'
import { startOfMonth, endOfMonth } from 'date-fns'
import { canCreateAppointment, canAddPatient, type Plan } from '@/lib/plan'
import { revalidatePath } from 'next/cache'

// ── Lookup profissional pelo código ──────────────────────────────────────────

export async function lookupByCode(code: string) {
  const pro = await db.query.professionals.findFirst({
    where: eq(professionals.connectCode, code.toUpperCase().trim()),
    columns: { id: true, displayName: true, businessName: true, specialty: true, connectCode: true },
  })
  if (!pro) return { success: false as const, error: 'Código não encontrado. Verifique e tente novamente.' }
  return { success: true as const, professional: pro }
}

// ── Conectar com profissional (cadastro do paciente) ─────────────────────────

export async function connectWithProfessional(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'patient') {
    return { success: false as const, error: 'Você precisa estar logada.' }
  }

  const code        = (formData.get('code') as string)?.toUpperCase().trim()
  const name        = (formData.get('name') as string)?.trim()
  const phone       = (formData.get('phone') as string)?.trim()
  const preferences = (formData.get('preferences') as string)?.trim() || null

  if (!code || !name || !phone) {
    return { success: false as const, error: 'Preencha todos os campos obrigatórios.' }
  }

  const professional = await db.query.professionals.findFirst({
    where: eq(professionals.connectCode, code),
  })
  if (!professional) return { success: false as const, error: 'Código inválido.' }

  // Já conectada?
  const conditions: ReturnType<typeof eq>[] = [
    eq(patients.userId, session.user.id),
  ]
  if (session.user.email) conditions.push(eq(patients.email, session.user.email))

  const existing = await db.query.patients.findFirst({
    where: and(
      eq(patients.professionalId, professional.id),
      or(...(conditions as [ReturnType<typeof eq>, ...ReturnType<typeof eq>[]])),
    ),
  })
  if (existing) return { success: true as const, alreadyConnected: true }

  // Verificar limite do plano
  const [{ total }] = await db.select({ total: count() }).from(patients)
    .where(eq(patients.professionalId, professional.id))
  if (!canAddPatient(professional.plan as Plan, Number(total))) {
    return { success: false as const, error: 'Esta profissional atingiu o limite de clientes no momento.' }
  }

  const [newPatient] = await db.insert(patients).values({
    professionalId: professional.id,
    userId:         session.user.id,
    name,
    phone:          phone.replace(/\D/g, ''),
    email:          session.user.email ?? null,
    preferences,
  }).returning({ id: patients.id })

  // Restrições clínicas informadas no cadastro
  const restrictionTechniques = (formData.getAll('restriction') as string[])
    .map(r => r.trim())
    .filter(Boolean)
  if (restrictionTechniques.length > 0) {
    await Promise.all(
      restrictionTechniques.map(technique =>
        db.insert(restrictions).values({ patientId: newPatient.id, technique, active: true })
      )
    )
  }

  revalidatePath('/cliente/inicio')
  return { success: true as const, alreadyConnected: false }
}

// ── Dados para o modal de agendamento ────────────────────────────────────────

export async function loadBookingData(professionalId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'patient') return null

  const today = new Date().toISOString().slice(0, 10)
  const [pro, proServices, upcoming, blocked] = await Promise.all([
    db.query.professionals.findFirst({
      where: eq(professionals.id, professionalId),
      columns: { lunchBreak: true },
    }),
    db.query.services.findMany({
      where: and(
        eq(services.professionalId, professionalId),
        eq(services.active, true),
      ),
      orderBy: (t, { asc }) => [asc(t.name)],
    }),
    db.query.appointments.findMany({
      where: and(
        eq(appointments.professionalId, professionalId),
        gte(appointments.startsAt, new Date()),
      ),
      columns: { startsAt: true, durationMin: true },
    }),
    db.query.blockedTimes.findMany({
      where: and(
        eq(blockedTimes.professionalId, professionalId),
        gte(blockedTimes.date, today),
      ),
      columns: { date: true, startTime: true, endTime: true },
    }),
  ])

  return {
    services: proServices,
    existingAppointments: upcoming,
    blockedTimes: blocked,
    lunchBreak: pro?.lunchBreak ?? null,
  }
}

// ── Criar agendamento ─────────────────────────────────────────────────────────

export async function createClientAppointment(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'patient') {
    return { success: false, error: 'Você precisa estar logada.' }
  }

  const professionalId = formData.get('professionalId') as string
  const serviceName    = formData.get('serviceName') as string
  const startsAtStr    = formData.get('startsAt') as string
  const notes          = (formData.get('notes') as string)?.trim() || null

  if (!professionalId || !serviceName || !startsAtStr) {
    return { success: false, error: 'Preencha todos os campos obrigatórios.' }
  }

  // Verificar se é paciente desta profissional
  const conditions: ReturnType<typeof eq>[] = [eq(patients.userId, session.user.id)]
  if (session.user.email) conditions.push(eq(patients.email, session.user.email))

  const patient = await db.query.patients.findFirst({
    where: and(
      eq(patients.professionalId, professionalId),
      or(...(conditions as [ReturnType<typeof eq>, ...ReturnType<typeof eq>[]])),
    ),
  })
  if (!patient) return { success: false, error: 'Você não está conectada a esta profissional.' }

  const professional = await db.query.professionals.findFirst({
    where: eq(professionals.id, professionalId),
  })
  if (!professional) return { success: false, error: 'Profissional não encontrada.' }

  const now = new Date()
  const [{ used }] = await db
    .select({ used: count() })
    .from(appointments)
    .where(and(
      eq(appointments.professionalId, professionalId),
      gte(appointments.startsAt, startOfMonth(now)),
      lt(appointments.startsAt, endOfMonth(now)),
    ))

  if (!canCreateAppointment(professional.plan as Plan, used)) {
    return { success: false, error: 'Agenda indisponível no momento.' }
  }

  const startsAt = new Date(startsAtStr)
  if (isNaN(startsAt.getTime())) return { success: false, error: 'Data inválida.' }

  if (startsAt <= new Date()) {
    return { success: false, error: 'Este horário já passou.' }
  }

  const service = await db.query.services.findFirst({
    where: and(
      eq(services.professionalId, professionalId),
      eq(services.name, serviceName),
      eq(services.active, true),
    ),
  })

  // Verificar conflito com agendamentos já existentes do profissional
  const durationMin = service?.durationMin ?? 60
  const endsAt      = new Date(startsAt.getTime() + durationMin * 60000)
  const dayStart    = new Date(startsAt); dayStart.setHours(0, 0, 0, 0)
  const dayEnd      = new Date(startsAt); dayEnd.setHours(23, 59, 59, 999)

  const dayAppointments = await db.query.appointments.findMany({
    where: and(
      eq(appointments.professionalId, professionalId),
      gte(appointments.startsAt, dayStart),
      lt(appointments.startsAt, dayEnd),
    ),
    columns: { startsAt: true, durationMin: true },
  })

  const BUFFER_MS = 10 * 60000
  const hasConflict = dayAppointments.some(apt => {
    const aptStart        = new Date(apt.startsAt)
    const aptEnd          = new Date(aptStart.getTime() + apt.durationMin * 60000)
    const aptEndWithBuffer = new Date(aptEnd.getTime() + BUFFER_MS)
    return startsAt < aptEndWithBuffer && endsAt > aptStart
  })

  if (hasConflict) {
    return { success: false, error: 'Este horário já está reservado. Escolha outro horário.' }
  }

  // Verificar horário de almoço recorrente
  if (professional.lunchBreak) {
    try {
      const lb = JSON.parse(professional.lunchBreak) as { start: string; end: string }
      if (lb.start && lb.end) {
        const [lh, lm] = lb.start.split(':').map(Number)
        const [eh, em] = lb.end.split(':').map(Number)
        const lunchStart = new Date(startsAt); lunchStart.setHours(lh, lm, 0, 0)
        const lunchEnd   = new Date(startsAt); lunchEnd.setHours(eh, em, 0, 0)
        if (startsAt < lunchEnd && endsAt > lunchStart) {
          return { success: false, error: 'Este horário coincide com a pausa de almoço.' }
        }
      }
    } catch {}
  }

  await db.insert(appointments).values({
    professionalId,
    patientId:    patient.id,
    patientName:  patient.name,
    patientPhone: patient.phone,
    serviceName,
    startsAt,
    durationMin,
    notes,
    status:       'scheduled',
  })

  revalidatePath('/cliente/inicio')
  revalidatePath('/cliente/agendamentos')
  return { success: true }
}
