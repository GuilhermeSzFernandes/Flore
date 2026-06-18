'use client'

import { Suspense, useState, useTransition } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

function LoginContent() {
  const params       = useSearchParams()
  const registered   = params.get('registered') === '1'

  const [tab, setTab]           = useState<'professional' | 'patient'>('patient')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [pending, startTransition] = useTransition()

  function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (res?.error) {
        toast.error('E-mail ou senha incorretos.')
      } else {
        const session = await getSession()
        window.location.href = session?.user?.role === 'admin' ? '/admin' : '/dashboard'
      }
    })
  }

  function handleGoogle() {
    startTransition(async () => {
      await signIn('google', { callbackUrl: '/cliente/inicio' })
    })
  }

  return (
    <div className="min-h-screen flex">
      {/* Painel esquerdo — marca */}
      <div
        className="hidden lg:flex w-[44%] flex-col justify-between p-12"
        style={{ background: 'var(--foreground)' }}
      >
        <span className="font-display italic text-3xl" style={{ color: 'var(--primary)' }}>
          Flore
        </span>
        <div className="space-y-4">
          {tab === 'patient' ? (
            <>
              <p className="text-4xl font-display italic leading-snug" style={{ color: 'oklch(0.88 0.01 80)' }}>
                Seu histórico.<br />Seus cuidados.<br />Sua evolução.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.60 0.02 155)' }}>
                Acesse seus agendamentos e acompanhe seu histórico de atendimentos de forma simples e segura.
              </p>
            </>
          ) : (
            <>
              <p className="text-4xl font-display italic leading-snug" style={{ color: 'oklch(0.88 0.01 80)' }}>
                Sua agenda.<br />Seus prontuários.<br />Seu negócio.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.60 0.02 155)' }}>
                A plataforma pensada para esteticistas e massagistas brasileiras que levam seu trabalho a sério.
              </p>
            </>
          )}
        </div>
        <p className="text-xs" style={{ color: 'oklch(0.40 0.015 155)' }}>
          © {new Date().getFullYear()} Flore
        </p>
      </div>

      {/* Painel direito */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-7">
          <div className="lg:hidden mb-2">
            <span className="font-display italic text-3xl text-primary">Flore</span>
          </div>

          {registered && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Conta criada com sucesso! Faça login para continuar.
            </div>
          )}

          {/* Tabs */}
          <div className="flex rounded-lg border border-border overflow-hidden text-sm font-medium">
            <button
              onClick={() => setTab('patient')}
              className={`flex-1 py-2.5 transition-colors ${tab === 'patient' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Sou cliente
            </button>
            <button
              onClick={() => setTab('professional')}
              className={`flex-1 py-2.5 transition-colors ${tab === 'professional' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Sou profissional
            </button>
          </div>

          {/* Fluxo profissional */}
          {tab === 'professional' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-2xl font-display font-semibold text-foreground">Entrar no painel</h1>
                <p className="text-sm text-muted-foreground">Acesse sua conta profissional.</p>
              </div>

              <form onSubmit={handleCredentials} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
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
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={pending}
                    className="h-10"
                  />
                </div>
                <Button type="submit" className="w-full h-10 font-medium" disabled={pending}>
                  {pending ? 'Entrando…' : 'Entrar'}
                </Button>
              </form>

              <p className="text-sm text-center text-muted-foreground">
                Ainda não tem conta?{' '}
                <Link href="/registro" className="text-primary font-medium underline underline-offset-4">
                  Criar conta
                </Link>
              </p>
            </div>
          )}

          {/* Fluxo cliente */}
          {tab === 'patient' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-2xl font-display font-semibold text-foreground">Acessar minha ficha</h1>
                <p className="text-sm text-muted-foreground">
                  Use sua conta Google para ver seus agendamentos e histórico de atendimentos.
                </p>
              </div>

              <Button
                onClick={handleGoogle}
                disabled={pending}
                size="lg"
                className="w-full gap-3 font-medium"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {pending ? 'Redirecionando…' : 'Continuar com Google'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Sua ficha será exibida conforme o cadastro feito pela sua profissional.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
