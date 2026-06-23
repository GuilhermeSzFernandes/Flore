'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { completeOnboarding } from '@/actions/onboarding'
import { toast } from 'sonner'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import AddressAutocomplete from '@/components/AddressAutocomplete'

type Specialty    = 'manicure' | 'hairdresser' | 'massagist' | 'esthetician' | 'other'
type MonthlyVolume = 'lt20' | 'around50' | 'around100'
type TeamSize     = 'solo' | 'up_to_5' | 'more_than_10'

interface OptionCardProps {
  label: string
  sublabel?: string
  emoji: string
  selected: boolean
  onClick: () => void
}

function OptionCard({ label, sublabel, emoji, selected, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border p-4 flex items-center gap-3 transition-all"
      style={selected ? {
        borderColor: 'oklch(0.575 0.115 27)',
        background:  'oklch(0.575 0.115 27 / 6%)',
      } : {
        borderColor: 'oklch(0.88 0.012 80)',
        background:  'white',
      }}
    >
      <span className="text-2xl leading-none">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'oklch(0.155 0.015 155)' }}>{label}</p>
        {sublabel && <p className="text-xs mt-0.5" style={{ color: 'oklch(0.55 0.010 155)' }}>{sublabel}</p>}
      </div>
      {selected && (
        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'oklch(0.575 0.115 27)' }}>
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </button>
  )
}

const TOTAL_STEPS = 5

interface Props {
  defaultName: string
}

export default function OnboardingForm({ defaultName }: Props) {
  const [step, setStep]             = useState(1)
  const [isPending, startTransition] = useTransition()

  const [displayName, setDisplayName]   = useState(defaultName)
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone]               = useState('')
  const [address, setAddress]           = useState('')
  const [latitude, setLatitude]         = useState<number | null>(null)
  const [longitude, setLongitude]       = useState<number | null>(null)
  const [specialty, setSpecialty]       = useState<Specialty | null>(null)
  const [monthlyVolume, setMonthlyVolume] = useState<MonthlyVolume | null>(null)
  const [teamSize, setTeamSize]       = useState<TeamSize | null>(null)
  const [homeVisits, setHomeVisits]   = useState<boolean | null>(null)

  function canAdvance() {
    if (step === 1) return displayName.trim().length > 0
    if (step === 2) return specialty !== null
    if (step === 3) return monthlyVolume !== null
    if (step === 4) return teamSize !== null
    if (step === 5) return homeVisits !== null
    return false
  }

  function handleSubmit() {
    const fd = new FormData()
    fd.set('displayName',   displayName.trim())
    fd.set('businessName',  businessName.trim())
    fd.set('phone',         phone)
    fd.set('address',       address.trim())
    if (latitude  !== null) fd.set('latitude',  String(latitude))
    if (longitude !== null) fd.set('longitude', String(longitude))
    if (specialty)     fd.set('specialty',     specialty)
    if (monthlyVolume) fd.set('monthlyVolume', monthlyVolume)
    if (teamSize)      fd.set('teamSize',      teamSize)
    if (homeVisits !== null) fd.set('homeVisits', String(homeVisits))

    startTransition(async () => {
      const result = await completeOnboarding(fd)
      if (result && !result.success) toast.error(result.error ?? 'Erro ao salvar perfil')
    })
  }

  const progress = (step / TOTAL_STEPS) * 100

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Título + progresso */}
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'oklch(0.575 0.115 27)' }}>
            Passo {step} de {TOTAL_STEPS}
          </p>
          <h1 className="text-2xl font-display font-semibold" style={{ color: 'oklch(0.155 0.015 155)' }}>
            {step === 1 && 'Configure seu perfil'}
            {step === 2 && 'Qual é a sua área?'}
            {step === 3 && 'Quantos atendimentos por mês?'}
            {step === 4 && 'Tamanho do seu negócio'}
            {step === 5 && 'Você atende a domicílio?'}
          </h1>
          {step === 1 && (
            <p className="text-sm" style={{ color: 'oklch(0.55 0.010 155)' }}>
              Você pode editar tudo depois em Configurações.
            </p>
          )}
        </div>

        {/* Barra de progresso */}
        <div className="h-1 rounded-full" style={{ background: 'oklch(0.88 0.012 80)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: 'oklch(0.575 0.115 27)' }}
          />
        </div>
      </div>

      {/* ── Step 1: nome + telefone ────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="displayName" className="text-sm font-medium">Seu nome profissional *</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: Ana Lima"
              required
              className="h-10"
            />
            <p className="text-xs" style={{ color: 'oklch(0.60 0.010 155)' }}>
              Usado internamente e no link público de agendamento.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="businessName" className="text-sm font-medium">Nome do negócio / estabelecimento</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ex: Studio Ana Lima, Espaço Bem-Estar..."
              className="h-10"
            />
            <p className="text-xs" style={{ color: 'oklch(0.60 0.010 155)' }}>
              Exibido para seus clientes. Deixe em branco para usar seu nome.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm font-medium">WhatsApp com DDD</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-0000"
              type="tel"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Endereço do local</Label>
            <AddressAutocomplete
              defaultValue={address}
              disabled={isPending}
              onSelect={({ address: a, latitude: lat, longitude: lng }) => {
                setAddress(a)
                setLatitude(lat)
                setLongitude(lng)
              }}
            />
            <p className="text-xs" style={{ color: 'oklch(0.60 0.010 155)' }}>
              Visível para seus clientes no painel deles.
            </p>
          </div>
        </div>
      )}

      {/* ── Step 2: especialidade ──────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-2">
          <OptionCard emoji="💅" label="Manicure / Nail designer"    selected={specialty === 'manicure'}    onClick={() => setSpecialty('manicure')} />
          <OptionCard emoji="✂️" label="Cabeleireiro(a)"             selected={specialty === 'hairdresser'} onClick={() => setSpecialty('hairdresser')} />
          <OptionCard emoji="🌿" label="Massagista"                  selected={specialty === 'massagist'}   onClick={() => setSpecialty('massagist')} />
          <OptionCard emoji="✨" label="Esteticista"                  selected={specialty === 'esthetician'} onClick={() => setSpecialty('esthetician')} />
          <OptionCard emoji="🔧" label="Outro"                        selected={specialty === 'other'}       onClick={() => setSpecialty('other')} />
        </div>
      )}

      {/* ── Step 3: volume mensal ─────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-2">
          <OptionCard emoji="🌱" label="Menos de 20 atendimentos"   sublabel="Começando ou agenda leve"          selected={monthlyVolume === 'lt20'}      onClick={() => setMonthlyVolume('lt20')} />
          <OptionCard emoji="🌿" label="Cerca de 50 atendimentos"   sublabel="Agenda moderada"                   selected={monthlyVolume === 'around50'}  onClick={() => setMonthlyVolume('around50')} />
          <OptionCard emoji="🌳" label="Cerca de 100 atendimentos"  sublabel="Agenda cheia ou múltiplos serviços" selected={monthlyVolume === 'around100'} onClick={() => setMonthlyVolume('around100')} />
        </div>
      )}

      {/* ── Step 4: tamanho do time ───────────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-2">
          <OptionCard emoji="🧍" label="Apenas eu"      sublabel="Profissional autônoma"        selected={teamSize === 'solo'}           onClick={() => setTeamSize('solo')} />
          <OptionCard emoji="👥" label="Até 5 pessoas"  sublabel="Pequeno estúdio ou equipe"    selected={teamSize === 'up_to_5'}        onClick={() => setTeamSize('up_to_5')} />
          <OptionCard emoji="🏢" label="Mais de 10"     sublabel="Clínica ou salão maior"       selected={teamSize === 'more_than_10'}   onClick={() => setTeamSize('more_than_10')} />
        </div>
      )}

      {/* ── Step 5: atende a domicílio ────────────────────────────────────── */}
      {step === 5 && (
        <div className="space-y-2">
          <OptionCard emoji="🏠" label="Sim, atendo a domicílio"      sublabel="Vou até o cliente"         selected={homeVisits === true}  onClick={() => setHomeVisits(true)} />
          <OptionCard emoji="🏪" label="Não, somente no meu espaço"   sublabel="Estúdio, clínica ou salão" selected={homeVisits === false} onClick={() => setHomeVisits(false)} />
        </div>
      )}

      {/* Navegação */}
      <div className="flex gap-3">
        {step > 1 && (
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-10"
            onClick={() => setStep((s) => s - 1)}
            disabled={isPending}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        )}

        {step < TOTAL_STEPS ? (
          <Button
            type="button"
            className="flex-1 h-10 font-medium"
            disabled={!canAdvance()}
            onClick={() => setStep((s) => s + 1)}
          >
            Continuar
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            className="flex-1 h-10 font-medium"
            disabled={!canAdvance() || isPending}
            onClick={handleSubmit}
          >
            {isPending ? 'Criando perfil…' : 'Criar meu perfil →'}
          </Button>
        )}
      </div>
    </div>
  )
}
