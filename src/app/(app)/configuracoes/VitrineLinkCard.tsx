'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { updateSlug } from '@/actions/services'
import { toast } from 'sonner'
import { Copy, Check, Share2, ExternalLink, Pencil, X } from 'lucide-react'

const terracota = 'oklch(0.575 0.115 27)'

// mesma normalização da action, para pré-visualizar enquanto digita
function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

export default function VitrineLinkCard({ slug, appUrl }: { slug: string; appUrl: string }) {
  const [currentSlug, setCurrentSlug] = useState(slug)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(slug)
  const [copied, setCopied] = useState(false)
  const [isPending, start] = useTransition()

  const link = `${appUrl}/agendar/${currentSlug}`
  const previewSlug = slugify(draft).replace(/^-|-$/g, '')

  async function handleCopy() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Link copiado')
  }

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Agende comigo',
          text: 'Veja meus serviços e agende um horário:',
          url: link,
        })
      } catch {
        /* usuário cancelou — ignorar */
      }
    } else {
      await handleCopy()
    }
  }

  function handleSave() {
    const fd = new FormData()
    fd.set('slug', draft)
    start(async () => {
      const result = await updateSlug(fd)
      if (result.success && result.slug) {
        setCurrentSlug(result.slug)
        setDraft(result.slug)
        setEditing(false)
        toast.success('Nome de usuário atualizado')
      } else {
        toast.error(result.error ?? 'Erro ao salvar')
      }
    })
  }

  function handleCancel() {
    setDraft(currentSlug)
    setEditing(false)
  }

  return (
    <div className="rounded-xl border border-border bg-background p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
            Sua vitrine pública
          </p>
          <p className="text-xs text-muted-foreground">
            Página que seus clientes veem antes de agendar — com seus serviços, horários e endereço.
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Editar nome de usuário"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">Nome de usuário</label>
          <div className="flex items-stretch rounded-lg border border-border overflow-hidden bg-card focus-within:border-ring">
            <span className="flex items-center px-3 text-xs text-muted-foreground bg-secondary/50 border-r border-border select-none">
              {appUrl.replace(/^https?:\/\//, '')}/agendar/
            </span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              placeholder="ana-lima"
              className="flex-1 min-w-0 px-3 h-10 text-sm bg-transparent outline-none"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {previewSlug.length >= 3 ? (
              <>Ficará: <span className="font-medium text-foreground">/agendar/{previewSlug}</span></>
            ) : (
              'Use ao menos 3 caracteres — letras, números e hífens.'
            )}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isPending || previewSlug.length < 3}
              className="h-8 text-xs gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              {isPending ? 'Salvando…' : 'Salvar'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-8 text-xs gap-1.5 text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: 'oklch(0.575 0.115 27 / 8%)' }}>
            <span className="text-sm font-medium truncate" style={{ color: terracota }}>
              {appUrl.replace(/^https?:\/\//, '')}/agendar/{currentSlug}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={handleShare} className="h-8 text-xs gap-1.5">
              <Share2 className="w-3.5 h-3.5" />
              Compartilhar vitrine
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="h-8 text-xs gap-1.5">
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar link'}
            </Button>
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir
            </a>
          </div>
        </>
      )}
    </div>
  )
}
