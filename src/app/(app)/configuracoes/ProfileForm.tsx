'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateProfessional } from '@/actions/services'
import { toast } from 'sonner'
import { Pencil, X } from 'lucide-react'
import CopyLinkButton from './CopyLinkButton'

interface Props {
  displayName: string
  phone: string
  businessName: string
  connectCode: string
  connectLink: string
}

export default function ProfileForm({ displayName, phone, businessName, connectCode, connectLink }: Props) {
  const [editing, setEditing]  = useState(false)
  const [name, setName]        = useState(displayName)
  const [biz, setBiz]          = useState(businessName)
  const [tel, setTel]          = useState(phone)
  const [isPending, start]     = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('displayName',  name.trim())
    fd.set('businessName', biz.trim())
    fd.set('phone',        tel)
    start(async () => {
      const result = await updateProfessional(fd)
      if (!result.success) { toast.error(result.error ?? 'Erro ao salvar'); return }
      toast.success('Dados salvos')
      setEditing(false)
    })
  }

  function handleCancel() {
    setName(displayName)
    setBiz(businessName)
    setTel(phone)
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="space-y-5">
        {/* Card de visualização */}
        <div className="relative rounded-xl border border-border bg-background p-5">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Editar dados"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4 pr-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                Nome profissional
              </p>
              <p className="text-sm font-medium text-foreground">{name || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                WhatsApp
              </p>
              <p className="text-sm font-medium text-foreground">{tel || '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                Nome do negócio
              </p>
              <p className="text-sm font-medium text-foreground">{biz || <span className="text-muted-foreground italic">Usando nome profissional</span>}</p>
            </div>
          </div>
        </div>

        {/* Código de conexão — sempre visível */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Código de conexão
          </p>
          <div className="flex items-center gap-3">
            <span
              className="font-mono font-bold text-2xl tracking-[0.3em] px-4 py-2 rounded-lg"
              style={{ background: 'oklch(0.575 0.115 27 / 8%)', color: 'oklch(0.575 0.115 27)' }}
            >
              {connectCode || '——————'}
            </span>
            <CopyLinkButton link={connectLink} label="Copiar link" />
          </div>
          <p className="text-xs text-muted-foreground">
            Compartilhe este código ou o link com seus clientes para que se conectem a você.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Nome profissional</Label>
          <Input value={name} onChange={e => setName(e.target.value)} required className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">WhatsApp</Label>
          <Input type="tel" value={tel} onChange={e => setTel(e.target.value)} className="h-10" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Nome do negócio / estabelecimento</Label>
        <Input
          value={biz}
          onChange={e => setBiz(e.target.value)}
          placeholder="Ex: Studio Ana Lima, Espaço Bem-Estar..."
          className="h-10"
        />
        <p className="text-xs text-muted-foreground">
          Deixe em branco para usar seu nome profissional.
        </p>
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Salvando…' : 'Salvar'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleCancel} className="gap-1.5">
          <X className="w-3.5 h-3.5" />
          Cancelar
        </Button>
      </div>
    </form>
  )
}
