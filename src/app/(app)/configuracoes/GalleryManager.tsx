'use client'

import { useRef, useState, useTransition } from 'react'
import { getGalleryUploadUrl, addGalleryImage, removeGalleryImage, reorderGallery } from '@/actions/profile'
import { toast } from 'sonner'
import { ImagePlus, Loader2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const MAX_IMAGES = 12

export default function GalleryManager({ initialUrls }: { initialUrls: string[] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [urls, setUrls] = useState(initialUrls)
  const [uploading, setUploading] = useState(false)
  const [isPending, start] = useTransition()

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    setUploading(true)
    try {
      for (const file of files) {
        if (urls.length >= MAX_IMAGES) {
          toast.error(`Limite de ${MAX_IMAGES} fotos atingido.`)
          break
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          toast.error(`"${file.name}" não é JPG, PNG ou WebP.`)
          continue
        }
        if (file.size > MAX_BYTES) {
          toast.error(`"${file.name}" ultrapassa 5 MB.`)
          continue
        }

        const signed = await getGalleryUploadUrl(file.type)
        if (!signed.success) { toast.error(signed.error); continue }

        const put = await fetch(signed.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })
        if (!put.ok) { toast.error(`Falha ao enviar "${file.name}".`); continue }

        const saved = await addGalleryImage(signed.publicUrl)
        if (saved.success) setUrls(saved.galleryUrls)
        else toast.error(saved.error)
      }
      toast.success('Fotos atualizadas')
    } finally {
      setUploading(false)
    }
  }

  function handleRemove(url: string) {
    start(async () => {
      const result = await removeGalleryImage(url)
      if (result.success) setUrls(result.galleryUrls)
      else toast.error(result.error)
    })
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= urls.length) return
    const next = [...urls]
    ;[next[index], next[target]] = [next[target], next[index]]
    setUrls(next)
    start(async () => {
      const result = await reorderGallery(next)
      if (!result.success) { toast.error(result.error); setUrls(urls) }
    })
  }

  const busy = uploading || isPending

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {urls.map((url, i) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-xl border"
            style={{ borderColor: 'oklch(0.88 0.012 80)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Foto do espaço ${i + 1}`} className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-between bg-black/0 p-1.5 opacity-0 transition-opacity group-hover:bg-black/25 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0 || busy}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-foreground disabled:opacity-30"
                aria-label="Mover para a esquerda"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleRemove(url)}
                disabled={busy}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-destructive disabled:opacity-30"
                aria-label="Remover foto"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === urls.length - 1 || busy}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-foreground disabled:opacity-30"
                aria-label="Mover para a direita"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {urls.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed text-muted-foreground transition-colors hover:bg-secondary/40 disabled:opacity-60"
            style={{ borderColor: 'oklch(0.575 0.115 27 / 40%)' }}
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            <span className="text-xs font-medium">{uploading ? 'Enviando…' : 'Adicionar foto'}</span>
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {urls.length}/{MAX_IMAGES} fotos · JPG, PNG ou WebP · até 5 MB cada. A ordem aqui é a ordem no carrossel da vitrine.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
    </div>
  )
}
