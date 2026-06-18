'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { registerProfessional } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function RegistroPage() {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await registerProfessional(formData)
      if (result && !result.success) {
        setError(result.error)
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen flex">
      {/* Painel esquerdo */}
      <div
        className="hidden lg:flex w-[44%] flex-col justify-between p-12"
        style={{ background: 'var(--foreground)' }}
      >
        <span className="font-display italic text-3xl" style={{ color: 'var(--primary)' }}>Flore</span>
        <div className="space-y-4">
          <p className="text-4xl font-display italic leading-snug" style={{ color: 'oklch(0.88 0.01 80)' }}>
            Crie sua conta.<br />Configure em minutos.<br />Comece a atender.
          </p>
        </div>
        <p className="text-xs" style={{ color: 'oklch(0.40 0.015 155)' }}>
          © {new Date().getFullYear()} Flore
        </p>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-7">
          <div className="lg:hidden mb-2">
            <span className="font-display italic text-3xl text-primary">Flore</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-display font-semibold text-foreground">Criar conta profissional</h1>
            <p className="text-sm text-muted-foreground">Você precisará de um código de convite para se cadastrar.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ana Silva"
                required
                disabled={pending}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                disabled={pending}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                required
                disabled={pending}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inviteCode">Código de convite</Label>
              <Input
                id="inviteCode"
                name="inviteCode"
                placeholder="Ex: FLORE2026"
                required
                disabled={pending}
                className="h-10 font-mono uppercase tracking-widest"
              />
              <p className="text-xs text-muted-foreground">Recebido pela equipe Flore durante o beta.</p>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full h-10 font-medium" disabled={pending}>
              {pending ? 'Criando conta…' : 'Criar conta →'}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary font-medium underline underline-offset-4">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
