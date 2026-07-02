'use server'

import { auth } from '@/auth'
import { db } from '@/db'
import { professionals } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { isS3Configured, createUploadUrl, publicUrl, deleteObject, keyFromUrl } from '@/lib/s3'

async function getProfessional(userId: string) {
  return db.query.professionals.findFirst({ where: eq(professionals.userId, userId) })
}

const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
}

/**
 * Gera uma URL pré-assinada para o navegador enviar a foto direto ao S3.
 * Retorna também a URL pública final, que depois é persistida via `saveAvatar`.
 */
export async function getAvatarUploadUrl(contentType: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Não autenticado' }

  if (!isS3Configured()) {
    return { success: false as const, error: 'Upload de imagens ainda não está configurado.' }
  }

  const ext = ALLOWED[contentType]
  if (!ext) return { success: false as const, error: 'Use uma imagem JPG, PNG ou WebP.' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false as const, error: 'Perfil não encontrado' }

  const key = `avatars/${professional.id}/${crypto.randomUUID()}.${ext}`
  const uploadUrl = await createUploadUrl(key, contentType)

  return { success: true as const, uploadUrl, publicUrl: publicUrl(key) }
}

/** Persiste a URL da foto após o upload concluído e remove a anterior do bucket. */
export async function saveAvatar(url: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false as const, error: 'Perfil não encontrado' }

  const previous = professional.avatarUrl

  await db.update(professionals).set({ avatarUrl: url }).where(eq(professionals.id, professional.id))

  // Limpa a imagem antiga (best-effort)
  if (previous && previous !== url) {
    const key = keyFromUrl(previous)
    if (key) { try { await deleteObject(key) } catch {} }
  }

  revalidatePath('/configuracoes')
  return { success: true as const, url }
}

/** Remove a foto de perfil. */
export async function removeAvatar() {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false as const, error: 'Perfil não encontrado' }

  const previous = professional.avatarUrl
  await db.update(professionals).set({ avatarUrl: null }).where(eq(professionals.id, professional.id))

  if (previous) {
    const key = keyFromUrl(previous)
    if (key) { try { await deleteObject(key) } catch {} }
  }

  revalidatePath('/configuracoes')
  return { success: true as const }
}

// ── Galeria de fotos do espaço (carrossel na vitrine) ───────────────────────

const MAX_GALLERY_IMAGES = 12

/** Gera uma URL pré-assinada para enviar uma foto do espaço direto ao S3. */
export async function getGalleryUploadUrl(contentType: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Não autenticado' }

  if (!isS3Configured()) {
    return { success: false as const, error: 'Upload de imagens ainda não está configurado.' }
  }

  const ext = ALLOWED[contentType]
  if (!ext) return { success: false as const, error: 'Use uma imagem JPG, PNG ou WebP.' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false as const, error: 'Perfil não encontrado' }

  const current = professional.galleryUrls ?? []
  if (current.length >= MAX_GALLERY_IMAGES) {
    return { success: false as const, error: `Limite de ${MAX_GALLERY_IMAGES} fotos atingido. Remova alguma para adicionar outra.` }
  }

  const key = `gallery/${professional.id}/${crypto.randomUUID()}.${ext}`
  const uploadUrl = await createUploadUrl(key, contentType)

  return { success: true as const, uploadUrl, publicUrl: publicUrl(key) }
}

/** Adiciona uma foto (já enviada ao S3) ao final da galeria do espaço. */
export async function addGalleryImage(url: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false as const, error: 'Perfil não encontrado' }

  const current = professional.galleryUrls ?? []
  if (current.length >= MAX_GALLERY_IMAGES) {
    return { success: false as const, error: `Limite de ${MAX_GALLERY_IMAGES} fotos atingido.` }
  }

  const next = [...current, url]
  await db.update(professionals).set({ galleryUrls: next }).where(eq(professionals.id, professional.id))

  revalidatePath('/servicos')
  return { success: true as const, galleryUrls: next }
}

/** Remove uma foto da galeria e apaga o objeto do bucket. */
export async function removeGalleryImage(url: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false as const, error: 'Perfil não encontrado' }

  const next = (professional.galleryUrls ?? []).filter((u) => u !== url)
  await db.update(professionals).set({ galleryUrls: next }).where(eq(professionals.id, professional.id))

  const key = keyFromUrl(url)
  if (key) { try { await deleteObject(key) } catch {} }

  revalidatePath('/servicos')
  return { success: true as const, galleryUrls: next }
}

/** Reordena a galeria (drag-and-drop simples baseado em índice). */
export async function reorderGallery(urls: string[]) {
  const session = await auth()
  if (!session?.user?.id) return { success: false as const, error: 'Não autenticado' }

  const professional = await getProfessional(session.user.id)
  if (!professional) return { success: false as const, error: 'Perfil não encontrado' }

  const current = new Set(professional.galleryUrls ?? [])
  if (urls.length !== current.size || !urls.every((u) => current.has(u))) {
    return { success: false as const, error: 'Lista de fotos inválida.' }
  }

  await db.update(professionals).set({ galleryUrls: urls }).where(eq(professionals.id, professional.id))

  revalidatePath('/servicos')
  return { success: true as const }
}
