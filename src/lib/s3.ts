import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * Configuração de armazenamento de objetos (S3 ou compatível — R2, MinIO…).
 * Variáveis de ambiente esperadas:
 *   S3_BUCKET             — nome do bucket
 *   S3_REGION             — região (ex.: sa-east-1)
 *   S3_ACCESS_KEY_ID      — credencial
 *   S3_SECRET_ACCESS_KEY  — credencial
 *   S3_ENDPOINT           — (opcional) endpoint customizado p/ S3-compatível
 *   S3_PUBLIC_URL         — (opcional) base pública/CDN dos objetos.
 *                           Se ausente, usa o endpoint padrão da AWS.
 */
const BUCKET      = process.env.S3_BUCKET
const REGION      = process.env.S3_REGION ?? 'us-east-1'
const ACCESS_KEY  = process.env.S3_ACCESS_KEY_ID
const SECRET_KEY  = process.env.S3_SECRET_ACCESS_KEY
const ENDPOINT    = process.env.S3_ENDPOINT || undefined
const PUBLIC_URL  = process.env.S3_PUBLIC_URL?.replace(/\/$/, '')

export function isS3Configured(): boolean {
  return Boolean(BUCKET && ACCESS_KEY && SECRET_KEY)
}

let _client: S3Client | null = null
function client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: REGION,
      endpoint: ENDPOINT,
      forcePathStyle: Boolean(ENDPOINT), // necessário p/ MinIO/R2 em path-style
      credentials: { accessKeyId: ACCESS_KEY!, secretAccessKey: SECRET_KEY! },
      // Evita que o SDK adicione params de checksum (x-amz-checksum-crc32) à
      // URL pré-assinada — eles exigem um header que o navegador não envia no
      // PUT direto e quebram a assinatura.
      requestChecksumCalculation: 'WHEN_REQUIRED',
    })
  }
  return _client
}

/** URL pública de leitura para uma chave. */
export function publicUrl(key: string): string {
  if (PUBLIC_URL) return `${PUBLIC_URL}/${key}`
  if (ENDPOINT)   return `${ENDPOINT.replace(/\/$/, '')}/${BUCKET}/${key}`
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`
}

/** Gera uma URL pré-assinada de upload (PUT) válida por alguns minutos. */
export async function createUploadUrl(key: string, contentType: string): Promise<string> {
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType })
  return getSignedUrl(client(), cmd, { expiresIn: 300 })
}

/** Remove um objeto (best-effort — falhas são ignoradas pelo chamador). */
export async function deleteObject(key: string): Promise<void> {
  await client().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

/** Extrai a chave a partir de uma URL pública gerada por `publicUrl`. */
export function keyFromUrl(url: string): string | null {
  try {
    if (PUBLIC_URL && url.startsWith(PUBLIC_URL)) return url.slice(PUBLIC_URL.length + 1)
    const u = new URL(url)
    const path = u.pathname.replace(/^\//, '')
    if (ENDPOINT && BUCKET && path.startsWith(`${BUCKET}/`)) return path.slice(BUCKET.length + 1)
    return path || null
  } catch {
    return null
  }
}
