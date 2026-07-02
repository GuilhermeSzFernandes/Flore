import { auth } from '@/auth'
import { db } from '@/db'
import { professionals } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  MessageCircle, Mail, LifeBuoy, Palette, Scissors, CalendarDays, CreditCard, ArrowRight,
} from 'lucide-react'
import SupportTicketForm from './SupportTicketForm'

const terracota = 'oklch(0.575 0.115 27)'
const terracotaSoft = 'oklch(0.575 0.115 27 / 10%)'

const HELP_LINKS = [
  { href: '/servicos', icon: Scissors, title: 'Serviços', desc: 'Cadastrar, editar e desativar o que você oferece.' },
  { href: '/configuracoes?tab=personalizacao', icon: Palette, title: 'Vitrine e link público', desc: 'Nome de usuário, foto e fotos do espaço.' },
  { href: '/agenda', icon: CalendarDays, title: 'Agenda', desc: 'Horários bloqueados e disponibilidade.' },
  { href: '/configuracoes?tab=plano', icon: CreditCard, title: 'Plano e limites', desc: 'O que muda entre Beta, Free, Pro e Clínica.' },
]

const FAQS = [
  {
    q: 'Como funciona o link público de agendamento?',
    a: 'Em Configurações → Personalização você escolhe um nome de usuário e recebe um link (flore.app/agendar/seu-nome). Compartilhe esse link com suas clientes — elas veem sua vitrine, escolhem um serviço e agendam sem precisar de conta prévia.',
  },
  {
    q: 'Preciso ter serviços cadastrados para o link funcionar?',
    a: 'Sim — pelo menos um serviço ativo em Meus Serviços. Sem isso, quem acessar sua vitrine não consegue escolher o que agendar.',
  },
  {
    q: 'Qual a diferença entre os planos?',
    a: 'Os planos Beta e Free têm limite de 30 agendamentos e 30 clientes por mês. Pro e Clínica removem esses limites e trazem recursos adicionais. Veja os detalhes em Configurações → Plano.',
  },
  {
    q: 'Como bloqueio um dia ou horário específico da minha agenda?',
    a: 'Em Meus Serviços → Disponibilidade você adiciona bloqueios pontuais (um feriado, uma ausência) sem precisar mexer nos seus horários fixos de atendimento.',
  },
  {
    q: 'Posso indicar outras profissionais e ganhar algo com isso?',
    a: 'Sim — em Configurações → Indicações você tem um link exclusivo. Cada profissional que se cadastrar por ele credita uma semana do plano Pro para você.',
  },
  {
    q: 'Encontrei um erro ou algo que não funciona como deveria.',
    a: 'Use o botão flutuante de feedback (canto inferior direito, em qualquer tela) ou abra um chamado aqui embaixo — nos dois casos, sua mensagem chega direto para o time.',
  },
]

export default async function SuportePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const professional = await db.query.professionals.findFirst({
    where: eq(professionals.userId, session.user.id),
  })
  if (!professional) redirect('/onboarding')

  const firstName = professional.displayName.split(' ')[0]
  const whatsapp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8 space-y-10">
      {/* Hero */}
      <header>
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">Suporte</p>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Como podemos ajudar, {firstName}?
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Tire dúvidas rápidas na Central de Ajuda ou fale direto com a gente.
        </p>
      </header>

      {/* Canais de atendimento */}
      <section className="grid gap-3 sm:grid-cols-2">
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary/40"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: terracotaSoft, color: terracota }}>
              <MessageCircle className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">WhatsApp</p>
              <p className="text-xs text-muted-foreground">Resposta rápida em horário comercial.</p>
            </div>
          </a>
        )}

        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary/40"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: terracotaSoft, color: terracota }}>
              <Mail className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">E-mail</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </a>
        )}

        <a
          href="#chamado"
          className={`flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary/40 ${!whatsapp && !email ? 'sm:col-span-2' : ''}`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: terracotaSoft, color: terracota }}>
            <LifeBuoy className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Abrir chamado</p>
            <p className="text-xs text-muted-foreground">Descreva o problema e a gente responde por e-mail.</p>
          </div>
        </a>
      </section>

      {/* Central de ajuda */}
      <section>
        <h2 className="mb-3 text-lg font-display font-semibold text-foreground">Central de ajuda</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {HELP_LINKS.map(({ href, icon: Icon, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary/40"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: terracotaSoft, color: terracota }}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="mb-3 text-lg font-display font-semibold text-foreground">Perguntas frequentes</h2>
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-foreground">
                {q}
                <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Abrir chamado */}
      <section id="chamado" className="scroll-mt-4">
        <h2 className="mb-3 text-lg font-display font-semibold text-foreground">Abrir chamado</h2>
        <SupportTicketForm />
      </section>
    </div>
  )
}
