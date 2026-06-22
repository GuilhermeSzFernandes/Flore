import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

const sql = neon(process.env.DATABASE_URL!)
const db  = drizzle(sql, { schema })

async function main() {
  const email    = process.env.ADMIN_EMAIL    ?? 'admin@flore.app'
  const password = process.env.ADMIN_PASSWORD ?? 'Admin@Flore2026'

  const existing = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  })

  if (existing) {
    await db.update(schema.users)
      .set({ role: 'admin', passwordHash: await bcrypt.hash(password, 12) })
      .where(eq(schema.users.id, existing.id))
    console.log(`✓ Senha do admin atualizada!`)
    console.log(`  E-mail: ${email}`)
    console.log(`  Senha:  ${password}`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await db.insert(schema.users).values({
    name:  'Admin',
    email,
    role:  'admin',
    passwordHash,
  })

  console.log('✓ Admin criado com sucesso!')
  console.log(`  E-mail: ${email}`)
  console.log(`  Senha:  ${password}`)
}

main().catch(err => { console.error(err); process.exit(1) })
