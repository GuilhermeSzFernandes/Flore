'use client'

import { useRef, useState, useTransition } from 'react'
import { getAvatarUploadUrl, saveAvatar, removeAvatar } from '@/actions/profile'
import { toast } from 'sonner'
import { Camera, Loader2, Trash2 } from 'lucide-react'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export default function AvatarUploader({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string | null
  displayName: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState(avatarUrl)
  const [uploading, setUploading] = useState(false)
  const [isPending, start] = useTransition()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite reenviar o mesmo arquivo
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Use uma imagem JPG, PNG ou WebP.')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('A imagem deve ter no máximo 5 MB.')
      return
    }

    setUploading(true)
    try {
      const signed = await getAvatarUploadUrl(file.type)
      if (!signed.success) {
        toast.error(signed.error)
        return
      }

      const put = await fetch(signed.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!put.ok) {
        toast.error('Falha ao enviar a imagem. Tente novamente.')
        return
      }

      const saved = await saveAvatar(signed.publicUrl)
      if (!saved.success) {
        toast.error(saved.error)
        return
      }
      setUrl(`${signed.publicUrl}?v=${Date.now()}`) // cache-bust
      toast.success('Foto atualizada')
    } catch {
      toast.error('Não foi possível enviar a imagem.')
    } finally {
      setUploading(false)
    }
  }

  function handleRemove() {
    start(async () => {
      const result = await removeAvatar()
      if (result.success) {
        setUrl(null)
        toast.success('Foto removida')
      } else {
        toast.error(result.error)
      }
    })
  }

  const busy = uploading || isPending

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border transition-opacity disabled:opacity-70"
        style={{ borderColor: 'oklch(0.88 0.012 80)', background: 'oklch(0.575 0.115 27 / 10%)' }}
        aria-label="Alterar foto de perfil"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Foto de perfil" className="h-full w-full object-cover" />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center font-display text-2xl italic"
            style={{ color: 'oklch(0.575 0.115 27)' }}
          >
            {initials(displayName) || '✿'}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
        </span>
      </button>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
            style={{ borderColor: 'oklch(0.88 0.012 80)' }}
          >
            {uploading ? 'Enviando…' : url ? 'Trocar foto' : 'Enviar foto'}
          </button>
          {url && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remover
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG ou WebP · até 5 MB.</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  )
}
