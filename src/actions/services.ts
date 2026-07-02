'use server'

import { auth } from '@/auth'
import { db } from '@/db'
import { services, professionals } from '@/db/schema'
import { eq, and, ne } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import type { Professional } from '@/db/schema'

async function getProfessional(userId: string) {
  return db.query.professionals.findFirst({
    where: eq(professionals.userId, userId),
  })
}

function generateConnectCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function ensureConnectCode(professionalId: string): Promise<Professional> {
  while (true) {
    const code = generateConnectCode()
    const exists = await db.query.professionals.findFirst({ where: eq(professionals.connectCode, code) })
    if (exists) continue
    const [updated] = await db
      .update(professionals)
      .set({ connectCode: code })
      .where(eq(professionals.id, professionalId))
      .returning()
    return updated
  }
}

export async function ensureReferralCode(professionalId: string): Promise<Professional> {
  while (true) {
    const code = generateConnectCode()
    const exists = await db.query.professionals.findFirst({ where: eq(professionals.referralCode, code) })
    if (exists) continue
    const [updated] = await db
      .update(professionals)
      .set({ referralCode: code })
      .where(eq(professionals.id, professionalId))
      .returning()
    return updated
  }
}

export async function createService(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false, error: 'Perfil não encontrado' }

  const name = formData.get('name') as string
  if (!name?.trim()) return { success: false, error: 'Nome do serviço é obrigatório' }

  const durationMin = parseInt(formData.get('durationMin') as string) || 60
  const priceRaw = formData.get('price') as string
  const priceInCents = priceRaw ? Math.round(parseFloat(priceRaw.replace(',', '.')) * 100) : null

  await db.insert(services).values({
    professionalId: professional.id,
    name:           name.trim(),
    durationMin,
    priceInCents:   priceInCents && !isNaN(priceInCents) ? priceInCents : null,
    active:         true,
  })

  revalidatePath('/configuracoes')
  return { success: true }
}

export async function updateService(serviceId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false, error: 'Perfil não encontrado' }

  const name = formData.get('name') as string
  const durationMin = parseInt(formData.get('durationMin') as string) || 60
  const priceRaw = formData.get('price') as string
  const priceInCents = priceRaw ? Math.round(parseFloat(priceRaw.replace(',', '.')) * 100) : null

  await db
    .update(services)
    .set({
      name:         name?.trim() || undefined,
      durationMin,
      priceInCents: priceInCents && !isNaN(priceInCents) ? priceInCents : null,
    })
    .where(and(eq(services.id, serviceId), eq(services.professionalId, professional.id)))

  revalidatePath('/configuracoes')
  return { success: true }
}

export async function toggleService(serviceId: string, active: boolean) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false, error: 'Perfil não encontrado' }

  await db
    .update(services)
    .set({ active })
    .where(and(eq(services.id, serviceId), eq(services.professionalId, professional.id)))

  revalidatePath('/configuracoes')
  return { success: true }
}

export async function updateProfessional(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false, error: 'Perfil não encontrado' }

  const displayName  = formData.get('displayName') as string
  const phone        = formData.get('phone') as string
  const businessName = (formData.get('businessName') as string)?.trim() || null
  const address      = (formData.get('address') as string)?.trim() || null

  await db
    .update(professionals)
    .set({
      displayName:  displayName?.trim() || professional.displayName,
      phone:        phone?.replace(/\D/g, '') || null,
      businessName,
      address,
    })
    .where(eq(professionals.id, professional.id))

  revalidatePath('/configuracoes')
  return { success: true }
}

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // remove acentos
    .replace(/[^a-z0-9\s-]/g, '')      // só letras/números/espaço/hífen
    .trim()
    .replace(/[\s_]+/g, '-')           // espaços → hífen
    .replace(/-+/g, '-')               // colapsa hífens
    .replace(/^-|-$/g, '')             // remove hífens das pontas
}

export async function updateSlug(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false, error: 'Perfil não encontrado' }

  const slug = slugify((formData.get('slug') as string) ?? '')
  if (slug.length < 3) {
    return { success: false, error: 'O nome de usuário precisa ter ao menos 3 caracteres.' }
  }

  const taken = await db.query.professionals.findFirst({
    where: and(eq(professionals.slug, slug), ne(professionals.id, professional.id)),
    columns: { id: true },
  })
  if (taken) {
    return { success: false, error: 'Este nome de usuário já está em uso. Tente outro.' }
  }

  await db
    .update(professionals)
    .set({ slug })
    .where(eq(professionals.id, professional.id))

  revalidatePath('/configuracoes')
  return { success: true, slug }
}

export async function updateBusinessData(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false, error: 'Perfil não encontrado' }

  const lunchStart = (formData.get('lunchStart') as string)?.trim()
  const lunchEnd   = (formData.get('lunchEnd')   as string)?.trim()
  const lunchBreak = lunchStart && lunchEnd
    ? JSON.stringify({ start: lunchStart, end: lunchEnd })
    : null

  await db
    .update(professionals)
    .set({
      businessName:        (formData.get('businessName') as string)?.trim() || null,
      businessDescription: (formData.get('businessDescription') as string)?.trim() || null,
      address:             (formData.get('address') as string)?.trim() || null,
      workingHours:        (formData.get('workingHours') as string)?.trim() || null,
      lunchBreak,
    })
    .where(eq(professionals.id, professional.id))

  revalidatePath('/servicos')
  return { success: true }
}

export async function createServiceFromServicos(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false, error: 'Perfil não encontrado' }

  const name = formData.get('name') as string
  if (!name?.trim()) return { success: false, error: 'Nome do serviço é obrigatório' }

  const durationMin = parseInt(formData.get('durationMin') as string) || 60
  const priceRaw = formData.get('price') as string
  const priceInCents = priceRaw ? Math.round(parseFloat(priceRaw.replace(',', '.')) * 100) : null

  await db.insert(services).values({
    professionalId: professional.id,
    name:           name.trim(),
    durationMin,
    priceInCents:   priceInCents && !isNaN(priceInCents) ? priceInCents : null,
    active:         true,
  })

  revalidatePath('/servicos')
  return { success: true }
}

export async function updateServiceFromServicos(serviceId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false, error: 'Perfil não encontrado' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { success: false, error: 'Nome do serviço é obrigatório' }

  const durationMin = parseInt(formData.get('durationMin') as string) || 60
  const priceRaw = formData.get('price') as string
  const priceInCents = priceRaw ? Math.round(parseFloat(priceRaw.replace(',', '.')) * 100) : null

  await db
    .update(services)
    .set({
      name,
      durationMin,
      priceInCents: priceInCents && !isNaN(priceInCents) ? priceInCents : null,
    })
    .where(and(eq(services.id, serviceId), eq(services.professionalId, professional.id)))

  revalidatePath('/servicos')
  return { success: true }
}

export async function toggleServiceFromServicos(serviceId: string, active: boolean) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false, error: 'Perfil não encontrado' }

  await db
    .update(services)
    .set({ active })
    .where(and(eq(services.id, serviceId), eq(services.professionalId, professional.id)))

  revalidatePath('/servicos')
  return { success: true }
}

export async function deleteServiceFromServicos(serviceId: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false, error: 'Perfil não encontrado' }

  const svc = await db.query.services.findFirst({
    where: and(eq(services.id, serviceId), eq(services.professionalId, professional.id)),
  })
  if (!svc) return { success: false, error: 'Serviço não encontrado' }
  if (svc.active) return { success: false, error: 'Desative o serviço antes de excluir' }

  await db
    .delete(services)
    .where(and(eq(services.id, serviceId), eq(services.professionalId, professional.id)))

  revalidatePath('/servicos')
  return { success: true }
}
