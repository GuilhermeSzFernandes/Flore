'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  PartyPopper, Scissors, Palette, Share2, ArrowRight, X, Link as LinkIcon,
  CalendarDays, HeartPulse, Link2,
} from 'lucide-react'

type Step = {
  icon: typeof PartyPopper
  title: string
  text: string
  cta?: { label: string; to: string }
}

const PROFESSIONAL_STEPS: Step[] = [
  {
    icon: PartyPopper,
    title: 'Bem-vinda ao Flore!',
    text: 'Sua conta está pronta. Em poucos passos você cadastra seus serviços, monta sua vitrine e já pode compartilhar o link de agendamento. Leva menos de um minuto.',
  },
  {
    icon: Scissors,
    title: 'Cadastre seus serviços',
    text: 'Em Meus Serviços você define nome, duração e preço de cada atendimento. Pelo menos um serviço ativo é necessário para o link público funcionar.',
  },
  {
    icon: Palette,
    title: 'Personalize sua vitrine',
    text: 'Em Configurações → Personalização você escolhe o nome de usuário do seu link, envia sua foto e fotos do espaço — tudo isso aparece para quem for agendar com você pela primeira vez.',
  },
  {
    icon: Share2,
    title: 'Compartilhe e comece a agendar',
    text: 'Com os serviços cadastrados e a vitrine pronta, copie seu link e compartilhe no WhatsApp, Instagram ou onde suas clientes estiverem.',
    cta: { label: 'Ver minha vitrine', to: '/configuracoes?tab=personalizacao' },
  },
]

const PATIENT_STEPS: Step[] = [
  {
    icon: PartyPopper,
    title: 'Bem-vinda ao Flore!',
    text: 'Seu cadastro está pronto. Aqui você acompanha seus agendamentos e fica conectada às profissionais que cuidam de você — tudo em um só lugar.',
  },
  {
    icon: CalendarDays,
    title: 'Seus agendamentos',
    text: 'Na tela Início você vê as próximas sessões e o histórico das já realizadas, com o nome da profissional e o serviço combinado.',
  },
  {
    icon: HeartPulse,
    title: 'Seu perfil de cuidados',
    text: 'Em Meu Perfil ficam suas restrições e preferências — informações que ajudam a profissional a te atender melhor a cada sessão.',
  },
  {
    icon: Link2,
    title: 'Conecte-se a uma profissional',
    text: 'Recebeu um código ou link de agendamento? Use-o para se conectar a uma nova profissional e marcar sua primeira sessão.',
    cta: { label: 'Ir para o Início', to: '/cliente/inicio' },
  },
]

export default function FloreTour({ variant = 'professional' }: { variant?: 'professional' | 'patient' }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const STEPS = variant === 'patient' ? PATIENT_STEPS : PROFESSIONAL_STEPS

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (searchParams.get('tour') === '1') {
      const t = setTimeout(() => setOpen(true), 400)
      // Remove o parâmetro da URL para o tour não reabrir num refresh
      router.replace(pathname, { scroll: false })
      return () => clearTimeout(t)
    }
    // Reage a searchParams (não só ao mount): redirects de Server Action para
    // uma rota do mesmo layout (ex: /cliente/cadastro → /cliente/inicio) são
    // navegações client-side que não remontam este componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function finish() {
    setOpen(false)
  }

  function finishAndGo(to: string) {
    finish()
    router.push(to)
  }

  function next() {
    if (step === STEPS.length - 1) finish()
    else setStep((s) => s + 1)
  }

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 animate-in fade-in duration-200"
        onClick={finish}
      />

      <div
        className="relative w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{ border: '1px solid oklch(0.88 0.012 80)' }}
      >
        <button
          type="button"
          onClick={finish}
          aria-label="Pular tour"
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div
          className="mb-5 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: 'oklch(0.575 0.115 27 / 12%)' }}
        >
          <Icon className="h-6 w-6" style={{ color: 'oklch(0.575 0.115 27)' }} />
        </div>

        <h2 className="font-display text-xl italic" style={{ color: 'oklch(0.155 0.015 155)' }}>
          {current.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'oklch(0.40 0.012 155)' }}>
          {current.text}
        </p>

        <div className="mt-6 flex items-center justify-center gap-1.5" role="tablist">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-label={`Passo ${i + 1}`}
              aria-selected={i === step}
              onClick={() => setStep(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === step ? '1.25rem' : '0.375rem',
                background: i === step ? 'oklch(0.575 0.115 27)' : 'oklch(0.575 0.115 27 / 25%)',
              }}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={finish}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {isLast ? 'Agora não' : 'Pular tour'}
          </button>

          {isLast && current.cta ? (
            <button
              type="button"
              onClick={() => finishAndGo(current.cta!.to)}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'oklch(0.575 0.115 27)' }}
            >
              {current.cta.label}
              <LinkIcon className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'oklch(0.575 0.115 27)' }}
            >
              Próximo
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
