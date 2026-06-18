'use client'

import { useState, useTransition } from 'react'
import { addClientRestriction, deactivateClientRestriction } from '@/actions/cliente-restrictions'
import { toast } from 'sonner'
import { AlertTriangle, Plus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Restriction {
  id: string
  technique: string
  reason: string | null
}

interface Props {
  activeRestrictions: Restriction[]
}

export default function RestricoesClient({ activeRestrictions }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [technique, setTechnique] = useState('')
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await addClientRestriction(fd)
      if (!result.success) { toast.error(result.error); return }
      toast.success('Restrição adicionada')
      setTechnique('')
      setReason('')
      setShowForm(false)
    })
  }

  function handleDeactivate(tech: string) {
    startTransition(async () => {
      const result = await deactivateClientRestriction(tech)
      if (!result.success) { toast.error(result.error); return }
      toast.success('Restrição removida')
    })
  }

  return (
    <div className="space-y-3">
      {activeRestrictions.length === 0 && !showForm ? (
        <p className="text-sm" style={{ color: 'oklch(0.60 0.010 155)' }}>
          Nenhuma restrição cadastrada.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {activeRestrictions.map(r => (
            <div
              key={r.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: 'oklch(0.577 0.245 27.325 / 10%)', color: 'oklch(0.45 0.18 25)' }}
            >
              <AlertTriangle className="w-3 h-3 shrink-0" />
              {r.technique}
              {r.reason && <span className="opacity-60">— {r.reason}</span>}
              <button
                type="button"
                onClick={() => handleDeactivate(r.technique)}
                disabled={isPending}
                className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                aria-label={`Remover ${r.technique}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleAdd} className="space-y-3 pt-3 border-t" style={{ borderColor: 'oklch(0.88 0.012 80)' }}>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={{ color: 'oklch(0.35 0.012 155)' }}>
              Técnica ou procedimento *
            </Label>
            <Input
              name="technique"
              value={technique}
              onChange={e => setTechnique(e.target.value)}
              placeholder="Ex: ventosaterapia, pedras quentes, bambu..."
              className="h-9 text-sm"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" style={{ color: 'oklch(0.35 0.012 155)' }}>
              Motivo (opcional)
            </Label>
            <Input
              name="reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: alergia, contraindicação médica..."
              className="h-9 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => { setShowForm(false); setTechnique(''); setReason('') }}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="h-8 text-xs" disabled={isPending}>
              {isPending && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
              Adicionar
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: 'oklch(0.575 0.115 27)' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar restrição
        </button>
      )}
    </div>
  )
}
