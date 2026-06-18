'use client'

import { useState, useTransition, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { lookupByCode, connectWithProfessional } from '@/actions/cliente'
import { toast } from 'sonner'
import { Search, CheckCircle2, ChevronRight, Plus, X } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  initialCode?: string
  initialName?: string
  initialPhone?: string
  onSuccess: () => void
}

const SPECIALTY_LABEL: Record<string, string> = {
  manicure:    '💅 Manicure / Nail designer',
  hairdresser: '✂️ Cabeleireiro(a)',
  massagist:   '🌿 Massagista',
  esthetician: '✨ Esteticista',
  other:       '🔧 Outro',
}

const PREFS_PLACEHOLDER: Record<string, string> = {
  manicure:    'Ex: prefiro esmaltação em gel, tenho unhas quebradiças...',
  hairdresser: 'Ex: cabelo colorido quimicamente, prefiro corte seco...',
  massagist:   'Ex: prefiro massagem mais leve, já fiz drenagem por 3 meses...',
  esthetician: 'Ex: pele sensível, já fiz peeling químico, tenho manchas...',
  other:       'Ex: preferências ou experiências anteriores relevantes...',
}

const RESTRICTIONS_EXAMPLE: Record<string, string> = {
  manicure:    'ex: acetona, gel UV, lixa elétrica',
  hairdresser: 'ex: amônia, progressiva, coloração permanente',
  massagist:   'ex: ventosaterapia, pedras quentes',
  esthetician: 'ex: ácido retinóico, peeling forte, laser',
  other:       'ex: técnicas ou produtos a evitar',
}

export default function ConnectModal({ open, onOpenChange, initialCode = '', initialName = '', initialPhone = '', onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const [step, setStep]   = useState<'code' | 'confirm' | 'done'>('code')
  const [code, setCode]   = useState(initialCode.toUpperCase())
  const [professional, setProfessional] = useState<{ id: string; displayName: string; businessName: string | null; specialty: string | null } | null>(null)
  const [name, setName]   = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [prefs, setPrefs] = useState('')
  const [restrictionList, setRestrictionList] = useState<string[]>([])

  // Se chegou com código pré-preenchido, já dispara o lookup
  useEffect(() => {
    if (initialCode && open) {
      setCode(initialCode.toUpperCase())
      handleLookup(initialCode.toUpperCase())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode, open])

  function handleLookup(overrideCode?: string) {
    const target = (overrideCode ?? code).toUpperCase().trim()
    if (target.length !== 6) { toast.error('O código deve ter 6 caracteres.'); return }
    startTransition(async () => {
      const result = await lookupByCode(target)
      if (!result.success) { toast.error(result.error); return }
      setProfessional(result.professional)
      setStep('confirm')
    })
  }

  function handleConnect(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('code', code)
    startTransition(async () => {
      const result = await connectWithProfessional(fd)
      if (!result.success) { toast.error(result.error ?? 'Erro ao conectar'); return }
      setStep('done')
    })
  }

  function handleClose() {
    setStep('code')
    setCode('')
    setProfessional(null)
    setName(initialName)
    setPhone(initialPhone)
    setPrefs('')
    setRestrictionList([])
    onOpenChange(false)
  }

  function handleDone() {
    handleClose()
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-semibold text-lg" style={{ color: 'oklch(0.155 0.015 155)' }}>
            {step === 'code'    && 'Conectar com profissional'}
            {step === 'confirm' && 'Complete seu cadastro'}
            {step === 'done'    && 'Conectada!'}
          </DialogTitle>
        </DialogHeader>

        {/* ── Passo 1: digitar código ────────────────────────────────── */}
        {step === 'code' && (
          <div className="space-y-5">
            <p className="text-sm" style={{ color: 'oklch(0.55 0.010 155)' }}>
              Insira o código de 6 dígitos que sua profissional compartilhou com você.
            </p>
            <div className="space-y-2">
              <Label className="text-xs font-medium" style={{ color: 'oklch(0.35 0.012 155)' }}>
                Código da profissional
              </Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder="EX: A3B9K2"
                className="h-12 text-center text-xl font-mono tracking-[0.4em] font-semibold"
                maxLength={6}
                autoFocus
              />
            </div>
            <Button
              className="w-full h-10 font-medium"
              disabled={code.length !== 6 || isPending}
              onClick={() => handleLookup()}
            >
              <Search className="w-4 h-4 mr-2" />
              {isPending ? 'Buscando...' : 'Buscar profissional'}
            </Button>
          </div>
        )}

        {/* ── Passo 2: confirmar + dados ─────────────────────────────── */}
        {step === 'confirm' && professional && (
          <form onSubmit={handleConnect} className="space-y-5">
            {/* Preview da profissional */}
            <div className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: 'oklch(0.88 0.012 80)', background: 'oklch(0.963 0.006 80)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white"
                style={{ background: 'oklch(0.575 0.115 27)' }}>
                {(professional.businessName ?? professional.displayName).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'oklch(0.155 0.015 155)' }}>
                  {professional.businessName ?? professional.displayName}
                </p>
                <p className="text-xs" style={{ color: 'oklch(0.55 0.010 155)' }}>
                  {professional.businessName
                    ? professional.displayName
                    : (SPECIALTY_LABEL[professional.specialty ?? ''] ?? '')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Nome e telefone: ocultos se já vieram do cadastro */}
              {initialName && initialPhone ? (
                <>
                  <input type="hidden" name="name" value={name} />
                  <input type="hidden" name="phone" value={phone} />
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium" style={{ color: 'oklch(0.35 0.012 155)' }}>
                      Seu nome completo *
                    </Label>
                    <Input
                      name="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Maria Silva"
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium" style={{ color: 'oklch(0.35 0.012 155)' }}>
                      Telefone com DDD *
                    </Label>
                    <Input
                      name="phone"
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99999-0000"
                      className="h-10 text-sm"
                    />
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium" style={{ color: 'oklch(0.35 0.012 155)' }}>
                  Preferências ou experiências anteriores
                </Label>
                <Textarea
                  name="preferences"
                  value={prefs}
                  onChange={(e) => setPrefs(e.target.value)}
                  rows={3}
                  placeholder={PREFS_PLACEHOLDER[professional.specialty ?? ''] ?? PREFS_PLACEHOLDER.other}
                  className="resize-none text-sm"
                />
                <p className="text-xs" style={{ color: 'oklch(0.65 0.010 155)' }}>
                  Opcional — ajuda a profissional a personalizar seu atendimento.
                </p>
              </div>
            </div>

            {/* Restrições */}
            <div className="space-y-2 pt-1 border-t" style={{ borderColor: 'oklch(0.88 0.012 80)' }}>
              <Label className="text-xs font-medium" style={{ color: 'oklch(0.35 0.012 155)' }}>
                Restrições
              </Label>
              <p className="text-xs" style={{ color: 'oklch(0.65 0.010 155)' }}>
                Técnicas que devem ser evitadas ({RESTRICTIONS_EXAMPLE[professional.specialty ?? ''] ?? RESTRICTIONS_EXAMPLE.other}). Opcional.
              </p>
              {restrictionList.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    name="restriction"
                    value={r}
                    onChange={e => {
                      const next = [...restrictionList]
                      next[i] = e.target.value
                      setRestrictionList(next)
                    }}
                    placeholder={`Restrição ${i + 1}`}
                    className="h-9 text-sm flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setRestrictionList(list => list.filter((_, j) => j !== i))}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Remover"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setRestrictionList(list => [...list, ''])}
                className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: 'oklch(0.575 0.115 27)' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar restrição
              </button>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1 h-10"
                onClick={() => { setStep('code'); setProfessional(null) }}>
                Voltar
              </Button>
              <Button type="submit" className="flex-1 h-10 font-medium" disabled={isPending}>
                {isPending ? 'Conectando...' : 'Confirmar cadastro'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </form>
        )}

        {/* ── Passo 3: sucesso ───────────────────────────────────────── */}
        {step === 'done' && (
          <div className="space-y-5 text-center py-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mx-auto"
              style={{ background: 'oklch(0.575 0.115 27 / 10%)' }}>
              <CheckCircle2 className="w-7 h-7" style={{ color: 'oklch(0.575 0.115 27)' }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'oklch(0.155 0.015 155)' }}>
                Tudo certo!
              </p>
              <p className="text-sm mt-1" style={{ color: 'oklch(0.55 0.010 155)' }}>
                Você está conectada com <strong>{professional?.businessName ?? professional?.displayName}</strong>. Agora pode agendar pelo seu painel.
              </p>
            </div>
            <Button className="w-full h-10 font-medium" onClick={handleDone}>
              Ir para o painel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
