'use server'

import { auth } from '@/auth'
import { db } from '@/db'
import { professionals, services } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

type Specialty = 'manicure' | 'hairdresser' | 'massagist' | 'esthetician' | 'other'
type MonthlyVolume = 'lt20' | 'around50' | 'around100'
type TeamSize = 'solo' | 'up_to_5' | 'more_than_10'

const DEFAULT_SERVICES: Record<Specialty, { name: string; durationMin: number }[]> = {
  manicure: [
    { name: 'Manicure',          durationMin: 60 },
    { name: 'Pedicure',          durationMin: 60 },
    { name: 'Esmaltação em gel', durationMin: 90 },
  ],
  hairdresser: [
    { name: 'Corte feminino', durationMin: 60 },
    { name: 'Coloração',      durationMin: 120 },
    { name: 'Escova',         durationMin: 60 },
  ],
  massagist: [
    { name: 'Massagem relaxante',   durationMin: 60 },
    { name: 'Drenagem linfática',   durationMin: 60 },
    { name: 'Massagem modeladora',  durationMin: 60 },
  ],
  esthetician: [
    { name: 'Limpeza de pele',   durationMin: 60 },
    { name: 'Peeling',           durationMin: 60 },
    { name: 'Hidratação facial', durationMin: 45 },
  ],
  other: [
    { name: 'Consulta', durationMin: 60 },
  ],
}

function generateConnectCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function getUniqueConnectCode(): Promise<string> {
  while (true) {
    const code = generateConnectCode()
    const exists = await db.query.professionals.findFirst({ where: eq(professionals.connectCode, code) })
    if (!exists) return code
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

async function getUniqueSlug(base: string): Promise<string> {
  const existing = await db.query.professionals.findFirst({
    where: eq(professionals.slug, base),
  })
  if (!existing) return base

  let suffix = 2
  while (true) {
    const candidate = `${base}-${suffix}`
    const exists = await db.query.professionals.findFirst({
      where: eq(professionals.slug, candidate),
    })
    if (!exists) return candidate
    suffix++
  }
}

export async function completeOnboarding(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const displayName   = (formData.get('displayName') as string)?.trim()
  const businessName  = (formData.get('businessName') as string)?.trim() || null
  const phone         = formData.get('phone') as string
  const address       = (formData.get('address') as string)?.trim() || null
  const specialty     = formData.get('specialty') as Specialty | null
  const monthlyVolume = formData.get('monthlyVolume') as MonthlyVolume | null
  const teamSize      = formData.get('teamSize') as TeamSize | null
  const homeVisitsRaw = formData.get('homeVisits') as string | null

  if (!displayName) return { success: false, error: 'Nome é obrigatório' }

  const baseSlug    = generateSlug(displayName)
  const slug        = await getUniqueSlug(baseSlug)
  const connectCode = await getUniqueConnectCode()

  const [professional] = await db
    .insert(professionals)
    .values({
      userId:        session.user.id,
      displayName,
      businessName,
      phone:         phone?.replace(/\D/g, '') || null,
      address,
      slug,
      plan:          'beta',
      specialty:     specialty     || null,
      monthlyVolume: monthlyVolume || null,
      teamSize:      teamSize      || null,
      homeVisits:    homeVisitsRaw !== null ? homeVisitsRaw === 'true' : null,
      connectCode,
    })
    .returning({ id: professionals.id })

  // Criar serviços padrão conforme a especialidade
  const defaultSvcs = DEFAULT_SERVICES[specialty ?? 'other']
  await db.insert(services).values(
    defaultSvcs.map((s) => ({
      professionalId: professional.id,
      name:           s.name,
      durationMin:    s.durationMin,
      active:         true,
    })),
  )

  redirect('/dashboard')
}
