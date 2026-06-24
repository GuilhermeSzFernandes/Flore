import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar, Users, MessageCircle, FileText, Lock, Zap, ArrowRight, Check,
} from 'lucide-react'
import FloreLogo from '@/components/FloreLogo'

export default async function LandingPage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <div className="min-h-dvh" style={{ background: 'oklch(0.963 0.006 80)' }}>

      {/* Grain overlay */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none select-none z-50 opacity-[0.028]"
        style={{
          backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='250' height='250'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='250' height='250' filter='url(%23n)'/></svg>")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Nav */}
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <FloreLogo size={28} textClassName="font-display italic text-2xl tracking-tight" textColor="oklch(0.155 0.015 155)" />
        <Link
          href="/login"
          className="text-sm font-medium px-4 py-2 rounded-lg border border-foreground text-foreground transition-all hover:bg-foreground hover:text-background active:scale-[0.97]"
        >
          Entrar
        </Link>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'oklch(0.155 0.015 155)' }}
      >
        <div
          className="absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage: `radial-gradient(ellipse at 15% 65%, oklch(0.575 0.115 27) 0%, transparent 52%),
                              radial-gradient(ellipse at 85% 10%, oklch(0.62 0.09 150) 0%, transparent 45%)`,
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-24 lg:py-36 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'oklch(0.575 0.115 27)' }}
              >
                Para esteticistas e massagistas
              </p>
              <h1
                className="text-5xl lg:text-6xl font-display font-semibold leading-[1.08] tracking-tight text-balance"
                style={{ color: 'oklch(0.963 0.006 80)' }}
              >
                Sua agenda.<br />
                Suas fichas.<br />
                <em>Seu negócio.</em>
              </h1>
            </div>

            <p
              className="text-lg leading-relaxed max-w-md"
              style={{ color: 'oklch(0.72 0.012 155)' }}
            >
              Flore reúne agendamento online, ficha de atendimento e comunicação com clientes em
              um único lugar — pensado para a realidade de quem trabalha sozinha ou em pequenos estúdios.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
                style={{ background: 'oklch(0.575 0.115 27)', color: 'white' }}
              >
                Começar gratuitamente
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#como-funciona"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium border transition-all hover:bg-white/10 active:scale-[0.97]"
                style={{
                  borderColor: 'oklch(0.30 0.012 155)',
                  color: 'oklch(0.72 0.012 155)',
                }}
              >
                Ver como funciona
              </Link>
            </div>

            <p className="text-xs" style={{ color: 'oklch(0.50 0.010 155)' }}>
              Acesso via Google · Sem cartão de crédito · Código de convite necessário na beta
            </p>
          </div>

          {/* Preview card */}
          <div className="hidden lg:block">
            <div
              className="rounded-2xl p-6 space-y-4 border"
              style={{
                background: 'oklch(0.20 0.015 155)',
                borderColor: 'oklch(0.26 0.012 155)',
                boxShadow: '0 0 0 1px oklch(0.30 0.012 155 / 40%), 0 32px 64px -16px oklch(0.08 0.012 155 / 70%)',
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.50 0.010 155)' }}>
                  Hoje · sua agenda
                </p>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'oklch(0.575 0.115 27 / 20%)', color: 'oklch(0.75 0.08 27)' }}
                >
                  3 sessões
                </span>
              </div>

              {[
                { hour: '09', min: '00', name: 'Mariana Costa', service: 'Drenagem linfática · 60 min', status: 'Confirmada', statusColor: 'oklch(0.52 0.13 145)' },
                { hour: '11', min: '30', name: 'Priscila Ferreira', service: 'Massagem relaxante · 90 min', status: 'Agendada', statusColor: 'oklch(0.50 0.010 155)' },
                { hour: '14', min: '00', name: 'Juliana Mendes', service: 'Pedras quentes · 60 min', status: 'Agendada', statusColor: 'oklch(0.50 0.010 155)' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-xl"
                  style={{ background: 'oklch(0.175 0.012 155)' }}
                >
                  <div className="shrink-0 text-center w-8">
                    <p className="text-2xl font-display font-medium tabular-nums leading-none" style={{ color: 'oklch(0.85 0.006 80)' }}>
                      {item.hour}
                    </p>
                    <p className="text-[11px] tabular-nums" style={{ color: 'oklch(0.48 0.010 155)' }}>{item.min}</p>
                  </div>
                  <div className="w-px self-stretch" style={{ background: 'oklch(0.26 0.012 155)' }} />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold" style={{ color: 'oklch(0.90 0.006 80)' }}>{item.name}</p>
                    <p className="text-xs" style={{ color: 'oklch(0.52 0.010 155)' }}>{item.service}</p>
                  </div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-md border shrink-0"
                    style={{ borderColor: item.statusColor, color: item.statusColor }}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'oklch(0.575 0.115 27)' }}>
            Tudo em um só lugar
          </p>
          <h2
            className="text-3xl lg:text-4xl font-display font-semibold text-balance max-w-sm"
            style={{ color: 'oklch(0.155 0.015 155)' }}
          >
            Feito para o seu dia a dia
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {[
            {
              icon: Calendar,
              title: 'Agenda visual',
              desc: 'Visualize seu dia e sua semana num grid de horários. Crie e gerencie agendamentos com poucos cliques.',
            },
            {
              icon: Users,
              title: 'Link de agendamento',
              desc: 'Compartilhe seu link personalizado e deixe suas clientes agendarem diretamente, sem precisar de você.',
            },
            {
              icon: MessageCircle,
              title: 'Lembrete pelo WhatsApp',
              desc: 'Envie lembretes de sessão com um clique — sem API paga, direto pelo seu WhatsApp.',
            },
            {
              icon: FileText,
              title: 'Ficha de atendimento',
              desc: 'Registre restrições técnicas, sensibilidades e notas de sessão com áreas tratadas e escala de dor.',
            },
            {
              icon: Lock,
              title: 'Dados confidenciais',
              desc: 'Sensibilidades e informações das suas clientes ficam protegidas e visíveis apenas para você.',
            },
            {
              icon: Zap,
              title: 'Histórico completo',
              desc: 'Acesse o histórico de sessões de cada cliente com evolução de dor, técnicas e observações.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex gap-5 p-6 rounded-2xl transition-all duration-200 hover:scale-[1.015] cursor-default"
              style={{ background: 'oklch(0.948 0.008 80)' }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'oklch(0.575 0.115 27 / 13%)' }}
              >
                <Icon className="w-5 h-5" style={{ color: 'oklch(0.575 0.115 27)' }} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-base" style={{ color: 'oklch(0.155 0.015 155)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.45 0.010 155)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section
        id="como-funciona"
        className="py-24"
        style={{ background: 'oklch(0.155 0.015 155)' }}
      >
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'oklch(0.575 0.115 27)' }}>
              Simples de usar
            </p>
            <h2
              className="text-3xl lg:text-4xl font-display font-semibold text-balance max-w-lg"
              style={{ color: 'oklch(0.963 0.006 80)' }}
            >
              Quatro passos até a sua primeira sessão agendada
            </h2>
          </div>

          <div>
            {[
              {
                n: '01',
                title: 'Crie sua conta',
                desc: 'Acesse com o Google, insira seu código de convite e configure seu nome profissional. Leva menos de 2 minutos.',
              },
              {
                n: '02',
                title: 'Cadastre seus serviços',
                desc: 'Adicione drenagem linfática, massagem, pedras quentes — com duração e preço. Seu link público fica pronto na hora.',
              },
              {
                n: '03',
                title: 'Compartilhe seu link',
                desc: 'Envie o link para suas clientes pelo Instagram, WhatsApp ou bio. Elas agendam direto, você aprova no painel.',
              },
              {
                n: '04',
                title: 'Gerencie tudo pelo Flore',
                desc: 'Acompanhe o dia no painel Hoje, acesse fichas, envie lembretes e registre notas pós-sessão.',
              },
            ].map(({ n, title, desc }) => (
              <div
                key={n}
                className="group flex gap-10 py-8 border-b"
                style={{ borderColor: 'oklch(0.22 0.012 155)' }}
              >
                <p
                  className="text-5xl font-display font-semibold tabular-nums shrink-0 leading-none mt-0.5 w-14 text-right select-none transition-colors duration-300 text-[oklch(0.255_0.014_155)] group-hover:text-primary"
                >
                  {n}
                </p>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-semibold" style={{ color: 'oklch(0.90 0.006 80)' }}>{title}</h3>
                  <p className="text-sm leading-relaxed max-w-lg" style={{ color: 'oklch(0.58 0.010 155)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'oklch(0.575 0.115 27)' }}>
            Planos
          </p>
          <h2
            className="text-3xl lg:text-4xl font-display font-semibold text-balance"
            style={{ color: 'oklch(0.155 0.015 155)' }}
          >
            Comece grátis, cresça com o Flore
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Gratuito */}
          <div
            className="rounded-2xl p-7 space-y-6"
            style={{ background: 'oklch(0.948 0.008 80)' }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'oklch(0.55 0.010 155)' }}>Gratuito</p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-4xl font-display font-semibold tabular-nums" style={{ color: 'oklch(0.155 0.015 155)' }}>R$ 0</p>
                <span className="text-sm" style={{ color: 'oklch(0.55 0.010 155)' }}>/mês</span>
              </div>
            </div>
            <ul className="space-y-3">
              {['30 agendamentos por mês', '30 clientes cadastrados', 'Link de agendamento público', 'Ficha básica de atendimento', 'Lembretes pelo WhatsApp'].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'oklch(0.38 0.012 155)' }}>
                  <Check className="w-4 h-4 shrink-0" style={{ color: 'oklch(0.575 0.115 27)' }} />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className="block w-full py-3 rounded-xl text-sm font-semibold border border-foreground text-foreground text-center transition-all hover:bg-foreground hover:text-background active:scale-[0.98]"
            >
              Começar gratuitamente
            </Link>
          </div>

          {/* Pro */}
          <div
            className="rounded-2xl p-7 space-y-6 relative overflow-hidden"
            style={{ background: 'oklch(0.155 0.015 155)' }}
          >
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage: `radial-gradient(ellipse at 85% 0%, oklch(0.575 0.115 27) 0%, transparent 55%)`,
              }}
            />
            <div className="relative space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'oklch(0.575 0.115 27)' }}>Pro</p>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-4xl font-display font-semibold tabular-nums" style={{ color: 'oklch(0.963 0.006 80)' }}>R$ 49</p>
                    <span className="text-sm" style={{ color: 'oklch(0.52 0.010 155)' }}>/mês</span>
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider mt-1"
                  style={{ background: 'oklch(0.575 0.115 27 / 18%)', color: 'oklch(0.72 0.08 27)' }}
                >
                  Em breve
                </span>
              </div>
              <ul className="space-y-3">
                {[
                  'Agendamentos ilimitados',
                  'Clientes ilimitados',
                  'Ficha completa com evolução',
                  'Histórico de sessões avançado',
                  'Suporte prioritário',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'oklch(0.60 0.010 155)' }}>
                    <Check className="w-4 h-4 shrink-0" style={{ color: 'oklch(0.575 0.115 27)' }} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                disabled
                className="w-full py-3 rounded-xl text-sm font-semibold opacity-30 cursor-not-allowed"
                style={{ background: 'oklch(0.575 0.115 27)', color: 'white' }}
              >
                Disponível em breve
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA + Footer — seção escura unificada */}
      <div style={{ background: 'oklch(0.155 0.015 155)' }}>
        <div
          className="relative overflow-hidden"
          style={{
            backgroundImage: `radial-gradient(ellipse at 50% 0%, oklch(0.575 0.115 27 / 10%) 0%, transparent 60%)`,
          }}
        >
          <div className="max-w-xl mx-auto px-6 pt-24 pb-16 text-center space-y-6">
            <h2
              className="text-4xl lg:text-5xl font-display font-semibold text-balance leading-tight"
              style={{ color: 'oklch(0.963 0.006 80)' }}
            >
              Pronta para simplificar sua agenda?
            </h2>
            <p className="text-sm" style={{ color: 'oklch(0.58 0.010 155)' }}>
              Junte-se às primeiras profissionais no acesso beta e ajude a moldar o Flore.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
                style={{ background: 'oklch(0.575 0.115 27)', color: 'white' }}
              >
                Começar agora
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-xs" style={{ color: 'oklch(0.40 0.010 155)' }}>Você precisará de um código de convite.</p>
          </div>
        </div>

        <footer
          className="max-w-6xl mx-auto px-6 py-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: 'oklch(0.215 0.012 155)' }}
        >
          <FloreLogo size={20} textClassName="font-display italic text-lg" textColor="oklch(0.575 0.115 27)" />
          <div className="flex items-center gap-6 text-xs" style={{ color: 'oklch(0.40 0.010 155)' }}>
            <span>© {new Date().getFullYear()} Flore · Agenda para esteticistas</span>
            <Link href="/privacidade" className="transition-opacity hover:opacity-70">Política de privacidade</Link>
            <Link href="/termos" className="transition-opacity hover:opacity-70">Termos de uso</Link>
          </div>
        </footer>
      </div>

    </div>
  )
}
