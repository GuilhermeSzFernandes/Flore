'use server'

import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

export async function registerProfessional(
  formData: FormData,
): Promise<{ success: false; error: string } | never> {
  const name       = (formData.get('name')       as string)?.trim()
  const email      = (formData.get('email')      as string)?.trim().toLowerCase()
  const password   = formData.get('password')   as string
  const inviteCode = (formData.get('inviteCode') as string)?.trim().toUpperCase()

  if (!name || !email || !password) {
    return { success: false, error: 'Preencha todos os campos obrigatórios.' }
  }
  if (password.length < 8) {
    return { success: false, error: 'A senha deve ter pelo menos 8 caracteres.' }
  }

  const validCodes = (process.env.INVITE_CODES ?? '')
    .split(',')
    .map(c => c.trim().toUpperCase())
  if (!validCodes.includes(inviteCode)) {
    return { success: false, error: 'Código de convite inválido.' }
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) {
    return { success: false, error: 'Este e-mail já está cadastrado.' }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await db.insert(users).values({
    name,
    email,
    role:         'professional',
    passwordHash,
  })

  redirect('/login?registered=1')
}
