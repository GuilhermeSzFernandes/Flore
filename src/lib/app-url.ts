import { headers } from 'next/headers'

/**
 * Retorna a URL base do app lendo o host real da requisição.
 * Funciona em dev (localhost) e em produção (Vercel, etc.) sem
 * precisar de variável de ambiente.
 * Se NEXT_PUBLIC_APP_URL estiver definida, ela tem prioridade.
 */
export async function getAppUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }

  const h = await headers()
  const host  = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto')?.split(',')[0] ?? (host.startsWith('localhost') ? 'http' : 'https')

  return `${proto}://${host}`
}
