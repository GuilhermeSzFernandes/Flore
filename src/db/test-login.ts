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
  const email    = process.argv[2] ?? 'guilhermesouzaf2021@gmail.com'
  const password = process.argv[3] ?? 'teste123'

  console.log(`\nTestando login para: ${email}`)
  console.log(`Senha testada:       ${password}\n`)

  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  })

  if (!user) { console.log('✗ Usuário não encontrado no banco.'); return }
  console.log(`✓ Usuário encontrado | role: ${user.role}`)
  console.log(`  passwordHash: ${user.passwordHash ? user.passwordHash.slice(0, 20) + '…' : 'NULL'}`)

  if (!user.passwordHash) { console.log('✗ passwordHash é NULL — sem senha definida.'); return }

  const valid = await bcrypt.compare(password, user.passwordHash)
  console.log(`\n  bcrypt.compare → ${valid ? '✓ VÁLIDO' : '✗ INVÁLIDO'}`)

  if (!valid) {
    // Gera um hash novo para confirmar que o bcrypt está funcionando
    const fresh = await bcrypt.hash(password, 12)
    const recheck = await bcrypt.compare(password, fresh)
    console.log(`  Hash novo gerado e comparado → ${recheck ? '✓ bcrypt OK' : '✗ bcrypt com problema'}`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
