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
  const newPassword = 'teste123'
  const passwordHash = await bcrypt.hash(newPassword, 12)

  const result = await db.update(schema.users)
    .set({ passwordHash })
    .where(eq(schema.users.role, 'professional'))
    .returning({ id: schema.users.id, email: schema.users.email })

  console.log(`✓ Senhas atualizadas para ${result.length} profissional(is).`)
  for (const u of result) {
    console.log(`  ${u.email} (${u.id})`)
  }
  console.log(`  Nova senha: ${newPassword}`)
}

main().catch(err => { console.error(err); process.exit(1) })
