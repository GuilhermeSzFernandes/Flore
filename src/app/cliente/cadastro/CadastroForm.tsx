'use client'

import { useState, useTransition } from 'react'
import { completePatientOnboarding } from '@/actions/patient-onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function CadastroForm({
  name: initialName,
  image,
  next,
}: {
  name: string
  image: string | null
  next?: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await completePatientOnboarding(fd, next)
      if (result && !result.success) {
        setError(result.error)
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-sm space-y-7">

        {/* Avatar + saudação */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Avatar className="w-14 h-14">
            <AvatarImage src={image ?? ''} />
            <AvatarFallback className="text-base font-semibold">
              {initialName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h1 className="text-2xl font-display font-semibold text-foreground">
              Complete seu cadastro
            </h1>
            <p className="text-sm text-muted-foreground">
              Confirme seu nome e adicione um telefone para continuar.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialName}
              placeholder="Maria Silva"
              required
              disabled={pending}
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone com DDD</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(11) 99999-0000"
              required
              disabled={pending}
              className="h-10"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="w-full h-11 font-medium gap-2"
          >
            {pending ? 'Salvando…' : 'Acessar minha conta'}
            {!pending && <ArrowRight className="w-4 h-4" />}
          </Button>
        </form>

      </div>
    </div>
  )
}
