'use server'

import { db } from '@/db'
import { users, professionals } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { signOut } from '@/auth'

export async function signOutAction() {
  await signOut({ redirectTo: '/login' })
}

export async function registerProfessional(
  formData: FormData,
): Promise<{ success: false; error: string } | never> {
  const name       = (formData.get('name')       as string)?.trim()
  const email      = (formData.get('email')      as string)?.trim().toLowerCase()
  const password   = formData.get('password')   as string
  const accessCode = (formData.get('accessCode') as string)?.trim().toUpperCase()

  if (!name || !email || !password) {
    return { success: false, error: 'Preencha todos os campos obrigatórios.' }
  }
  if (password.length < 8) {
    return { success: false, error: 'A senha deve ter pelo menos 8 caracteres.' }
  }
  if (!accessCode) {
    return { success: false, error: 'Informe um código de acesso ou indicação.' }
  }

  // Verifica se é um código Flore (env var) OU código de indicação de profissional
  const floreCodes = (process.env.INVITE_CODES ?? '')
    .split(',')
    .map(c => c.trim().toUpperCase())
    .filter(Boolean)

  const isFloreCode = floreCodes.includes(accessCode)

  let referredByCode: string | null = null
  if (!isFloreCode) {
    const referrer = await db.query.professionals.findFirst({
      where: eq(professionals.referralCode, accessCode),
      columns: { id: true },
    })
    if (!referrer) {
      return { success: false, error: 'Código de acesso ou indicação inválido.' }
    }
    referredByCode = accessCode
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) {
    return { success: false, error: 'Este e-mail já está cadastrado.' }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await db.insert(users).values({
    name,
    email,
    role:           'professional',
    passwordHash,
    referredByCode,
  })

  redirect('/login?registered=1')
}

/** Busca o nome do profissional que possui o código de indicação (para exibir no registro). */
export async function getReferrerByCode(code: string) {
  if (!code || code.length !== 6) return null
  const pro = await db.query.professionals.findFirst({
    where: eq(professionals.referralCode, code.toUpperCase()),
    columns: { displayName: true, businessName: true },
  })
  return pro ?? null
}
