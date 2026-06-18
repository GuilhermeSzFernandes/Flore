'use client'

import { useTransition } from 'react'
import { completePatientOnboarding } from '@/actions/patient-onboarding'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowRight, CheckCircle } from 'lucide-react'

const BENEFITS = [
  'Veja seus agendamentos em um só lugar',
  'Acesse sua ficha de atendimento',
  'Receba lembretes das suas sessões',
]

export default function CadastroForm({
  name,
  image,
  next,
}: {
  name: string
  image: string | null
  next?: string
}) {
  const firstName = name.split(' ')[0]
  const [pending, startTransition] = useTransition()

  function handleContinue() {
    startTransition(async () => {
      await completePatientOnboarding(next)
    })
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-sm space-y-8">

        {/* Avatar + saudação */}
        <div className="flex flex-col items-center gap-4 text-center">
          <Avatar className="w-16 h-16">
            <AvatarImage src={image ?? ''} />
            <AvatarFallback className="text-lg font-semibold">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-display font-semibold text-foreground">
              Bem-vinda, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sua conta foi criada. Aqui você acompanha seus atendimentos e histórico com suas profissionais.
            </p>
          </div>
        </div>

        {/* Lista de benefícios */}
        <ul className="space-y-3">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="flex items-start gap-3 text-sm"
              style={{ color: 'oklch(0.35 0.012 155)' }}
            >
              <CheckCircle
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{ color: 'oklch(0.575 0.115 27)' }}
              />
              {benefit}
            </li>
          ))}
        </ul>

        <Button
          onClick={handleContinue}
          disabled={pending}
          className="w-full h-11 font-medium gap-2"
        >
          {pending ? 'Acessando…' : 'Acessar minha conta'}
          {!pending && <ArrowRight className="w-4 h-4" />}
        </Button>

      </div>
    </div>
  )
}
