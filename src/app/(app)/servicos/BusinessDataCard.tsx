'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { updateBusinessData } from '@/actions/services'
import { toast } from 'sonner'
import { Pencil, X, MapPin, Clock, Building2, FileText, Coffee } from 'lucide-react'
import WorkingHoursEditor, { DAYS, DEFAULT_SCHEDULE, parseSchedule } from './WorkingHoursEditor'

interface Props {
  businessName: string
  businessDescription: string
  address: string
  workingHours: string
  lunchBreak: string
}

function WorkingHoursView({ raw }: { raw: string }) {
  const schedule = parseSchedule(raw)
  if (!schedule) return null

  type Group = { days: string[]; open: string; close: string }
  const groups: Group[] = []

  for (const { key, short } of DAYS) {
    const day = schedule[key]
    if (day == null) continue
    const last = groups[groups.length - 1]
    if (last && last.open === day.open && last.close === day.close) {
      last.days.push(short)
    } else {
      groups.push({ days: [short], open: day.open, close: day.close })
    }
  }

  if (groups.length === 0) return null

  return (
    <div className="space-y-1.5">
      {groups.map((g, i) => (
        <div key={i} className="flex items-baseline justify-between gap-6">
          <span
            className="text-xs font-medium tracking-wide tabular-nums"
            style={{ color: 'oklch(0.50 0.010 155)' }}
          >
            {g.days[0]}{g.days.length > 1 ? ` – ${g.days[g.days.length - 1]}` : ''}
          </span>
          <span
            className="text-sm tabular-nums font-medium"
            style={{ color: 'oklch(0.50 0.095 27)' }}
          >
            {g.open} – {g.close}
          </span>
        </div>
      ))}
    </div>
  )
}

function parseLunch(raw: string): { start: string; end: string } | null {
  if (!raw) return null
  try {
    const p = JSON.parse(raw)
    if (p && typeof p.start === 'string' && typeof p.end === 'string') return p
  } catch {}
  return null
}

export default function BusinessDataCard({
  businessName, businessDescription, address, workingHours, lunchBreak: lunchBreakRaw,
}: Props) {
  const [editing, setEditing]   = useState(false)
  const [name, setName]         = useState(businessName)
  const [description, setDesc]  = useState(businessDescription)
  const [addr, setAddr]         = useState(address)
  const [hours, setHours]       = useState(() => workingHours || JSON.stringify(DEFAULT_SCHEDULE))
  const [isPending, start]      = useTransition()

  const parsedLunch = parseLunch(lunchBreakRaw)
  const [lunchEnabled, setLunchEnabled] = useState(!!parsedLunch)
  const [lunchStart, setLunchStart]     = useState(parsedLunch?.start ?? '12:00')
  const [lunchEnd, setLunchEnd]         = useState(parsedLunch?.end   ?? '13:00')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('businessName',        name.trim())
    fd.set('businessDescription', description.trim())
    fd.set('address',             addr.trim())
    fd.set('workingHours',        hours.trim())
    if (lunchEnabled) {
      fd.set('lunchStart', lunchStart)
      fd.set('lunchEnd',   lunchEnd)
    }
    start(async () => {
      const result = await updateBusinessData(fd)
      if (!result.success) { toast.error(result.error ?? 'Erro ao salvar'); return }
      toast.success('Dados salvos')
      setEditing(false)
    })
  }

  function handleCancel() {
    setName(businessName)
    setDesc(businessDescription)
    setAddr(address)
    setHours(workingHours || JSON.stringify(DEFAULT_SCHEDULE))
    setLunchEnabled(!!parsedLunch)
    setLunchStart(parsedLunch?.start ?? '12:00')
    setLunchEnd(parsedLunch?.end   ?? '13:00')
    setEditing(false)
  }

  if (!editing) {
    const parsedHoursView = parseSchedule(hours)
    const hasOpenDays = !!parsedHoursView && Object.values(parsedHoursView).some(d => d != null)
    const empty = !name && !description && !addr && !hasOpenDays && !parsedLunch
    return (
      <div className="relative rounded-xl border border-border bg-background p-5">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Editar dados do negócio"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>

        {empty ? (
          <p className="text-sm text-muted-foreground italic pr-8">
            Nenhum dado preenchido ainda.{' '}
            <button type="button" onClick={() => setEditing(true)} className="underline underline-offset-2 hover:text-foreground transition-colors">
              Adicionar agora
            </button>
          </p>
        ) : (
          <div className="space-y-4 pr-8">
            {name && (
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Nome do negócio</p>
                  <p className="text-sm font-medium text-foreground">{name}</p>
                </div>
              </div>
            )}
            {description && (
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Descrição</p>
                  <p className="text-sm text-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            )}
            {addr && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Endereço</p>
                  <p className="text-sm text-foreground">{addr}</p>
                </div>
              </div>
            )}
            {hasOpenDays && (
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Horários</p>
                  <WorkingHoursView raw={hours} />
                </div>
              </div>
            )}
            {parsedLunch && (
              <div className="flex items-start gap-3">
                <Coffee className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Pausa de almoço</p>
                  <p className="text-sm tabular-nums font-medium" style={{ color: 'oklch(0.50 0.095 27)' }}>
                    {parsedLunch.start} – {parsedLunch.end}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Nome do negócio / estúdio</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Studio Ana Lima" className="h-10" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Descrição</Label>
        <Textarea
          value={description}
          onChange={e => setDesc(e.target.value)}
          placeholder="Conte um pouco sobre seus serviços e diferenciais..."
          rows={3}
          className="resize-none text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Endereço</Label>
        <Input value={addr} onChange={e => setAddr(e.target.value)} placeholder="Rua, número, bairro, cidade — UF" className="h-10" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Horários de atendimento</Label>
        <WorkingHoursEditor value={hours} onChange={setHours} />
      </div>

      {/* Pausa de almoço */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Pausa de almoço</Label>
          <button
            type="button"
            onClick={() => setLunchEnabled(v => !v)}
            className="flex items-center gap-2 text-sm"
            style={{ color: 'oklch(0.40 0.080 155)' }}
          >
            <span
              className="w-9 h-5 rounded-full relative flex items-center transition-colors"
              style={{ background: lunchEnabled ? 'oklch(0.575 0.115 27)' : 'oklch(0.82 0.008 155)' }}
            >
              <span
                className="absolute w-4 h-4 bg-white rounded-full shadow transition-all"
                style={{ left: lunchEnabled ? '18px' : '2px' }}
              />
            </span>
            <span className="text-xs text-muted-foreground">{lunchEnabled ? 'Ativada' : 'Desativada'}</span>
          </button>
        </div>

        {lunchEnabled && (
          <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: 'oklch(0.88 0.012 80)' }}>
            <Coffee className="w-4 h-4 shrink-0 text-muted-foreground" />
            <div className="flex items-center gap-2 flex-1">
              <input
                type="time"
                value={lunchStart}
                onChange={e => setLunchStart(e.target.value)}
                className="h-8 px-2 rounded-md border text-sm tabular-nums"
                style={{ borderColor: 'oklch(0.88 0.012 80)', color: 'oklch(0.20 0.015 155)' }}
              />
              <span className="text-xs text-muted-foreground">até</span>
              <input
                type="time"
                value={lunchEnd}
                onChange={e => setLunchEnd(e.target.value)}
                className="h-8 px-2 rounded-md border text-sm tabular-nums"
                style={{ borderColor: 'oklch(0.88 0.012 80)', color: 'oklch(0.20 0.015 155)' }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Nenhum cliente poderá agendar neste intervalo.</p>
          </div>
        )}
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
