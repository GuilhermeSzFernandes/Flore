'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  updateServiceFromServicos,
  toggleServiceFromServicos,
  deleteServiceFromServicos,
} from '@/actions/services'
import { toast } from 'sonner'
import { Scissors, Clock, Pencil, Trash2, Check, X } from 'lucide-react'
import type { Service } from '@/db/schema'

const terracota = 'oklch(0.575 0.115 27)'
const terracotaSoft = 'oklch(0.575 0.115 27 / 10%)'

const brl = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

export default function ServiceRow({ svc }: { svc: Service }) {
  const [editing, setEditing] = useState(false)
  const [isPending, start] = useTransition()

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const result = await updateServiceFromServicos(svc.id, fd)
      if (result.success) {
        toast.success('Serviço atualizado')
        setEditing(false)
      } else {
        toast.error(result.error ?? 'Erro ao salvar')
      }
    })
  }

  function handleToggle() {
    start(async () => {
      const result = await toggleServiceFromServicos(svc.id, !svc.active)
      if (!result.success) toast.error(result.error ?? 'Erro ao atualizar')
    })
  }

  function handleDelete() {
    start(async () => {
      const result = await deleteServiceFromServicos(svc.id)
      if (!result.success) toast.error(result.error ?? 'Erro ao excluir')
    })
  }

  // ── Modo de edição ──────────────────────────────────────────────────────
  if (editing) {
    return (
      <li className="px-4 md:px-5 py-4" style={{ background: 'oklch(0.575 0.115 27 / 4%)' }}>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Nome *</Label>
              <Input name="name" defaultValue={svc.name} required className="h-9 text-sm bg-card" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Duração (min)</Label>
              <Input
                name="durationMin"
                type="number"
                defaultValue={svc.durationMin}
                min="15"
                step="15"
                className="h-9 text-sm bg-card"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Preço (R$)</Label>
              <Input
                name="price"
                type="number"
                defaultValue={svc.priceInCents != null ? (svc.priceInCents / 100).toFixed(2) : ''}
                placeholder="—"
                step="0.01"
                className="h-9 text-sm bg-card"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={isPending} className="h-8 text-xs gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {isPending ? 'Salvando…' : 'Salvar'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
              className="h-8 text-xs gap-1.5 text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
              Cancelar
            </Button>
          </div>
        </form>
      </li>
    )
  }

  // ── Modo de exibição ────────────────────────────────────────────────────
  return (
    <li className={`flex items-center gap-4 px-4 md:px-5 py-4 ${!svc.active ? 'opacity-55' : ''}`}>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: terracotaSoft, color: terracota }}
      >
        <Scissors className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">{svc.name}</p>
          {!svc.active && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-secondary text-muted-foreground shrink-0">
              Inativo
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <Clock className="w-3 h-3 shrink-0" />
          {svc.durationMin} min
        </p>
      </div>

      <div className="text-right shrink-0">
        {svc.priceInCents != null ? (
          <p className="text-sm font-semibold text-foreground tabular-nums">{brl(svc.priceInCents)}</p>
        ) : (
          <p className="text-xs text-muted-foreground italic">sem preço</p>
        )}
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setEditing(true)}
          disabled={isPending}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label={`Editar ${svc.name}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          disabled={isPending}
          className="h-8 text-xs text-muted-foreground"
        >
          {svc.active ? 'Desativar' : 'Ativar'}
        </Button>
        {!svc.active && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isPending}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            aria-label={`Excluir ${svc.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </li>
  )
}
