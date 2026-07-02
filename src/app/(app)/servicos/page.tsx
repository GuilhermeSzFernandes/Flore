import { auth } from '@/auth'
import { db } from '@/db'
import { professionals, services } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createServiceFromServicos } from '@/actions/services'
import { getUpcomingBlockedTimes } from '@/actions/blocked-times'
import BusinessDataCard from './BusinessDataCard'
import BlockedTimesManager from './BlockedTimesManager'
import ServiceRow from './ServiceRow'
import { Scissors, Clock, Wallet, CircleCheck, Plus, Store, CalendarX } from 'lucide-react'

const terracota = 'oklch(0.575 0.115 27)'
const terracotaSoft = 'oklch(0.575 0.115 27 / 10%)'
const terracotaMuted = 'oklch(0.575 0.115 27 / 10%)'

const brl = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

const TABS = [
  { id: 'servicos', label: 'Serviços', icon: Scissors },
  { id: 'negocio', label: 'Negócio', icon: Store },
  { id: 'disponibilidade', label: 'Disponibilidade', icon: CalendarX },
] as const

type TabId = (typeof TABS)[number]['id']

export default async function ServicosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: tabParam } = await searchParams
  const tab: TabId = (TABS.some((t) => t.id === tabParam) ? tabParam : 'servicos') as TabId

  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const professional = await db.query.professionals.findFirst({
    where: eq(professionals.userId, session.user.id),
  })
  if (!professional) redirect('/onboarding')

  const [allServices, upcomingBlocked] = await Promise.all([
    db.query.services.findMany({
      where: eq(services.professionalId, professional.id),
      orderBy: (t, { asc }) => [asc(t.name)],
    }),
    getUpcomingBlockedTimes(professional.id),
  ])

  // ── Resumo (dados reais) ───────────────────────────────────
  const active = allServices.filter((s) => s.active)
  const priced = active.filter((s) => s.priceInCents != null)
  const avgDuration = active.length
    ? Math.round(active.reduce((sum, s) => sum + s.durationMin, 0) / active.length)
    : 0
  const avgTicket = priced.length
    ? Math.round(priced.reduce((sum, s) => sum + (s.priceInCents ?? 0), 0) / priced.length)
    : null

  const stats = [
    { icon: CircleCheck, label: active.length === 1 ? 'serviço ativo' : 'serviços ativos', value: String(active.length) },
    { icon: Clock, label: 'duração média', value: avgDuration ? `${avgDuration} min` : '—' },
    { icon: Wallet, label: 'ticket médio', value: avgTicket != null ? brl(avgTicket) : '—' },
  ]

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <header className="mb-7">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">Negócio</p>
        <h1 className="text-3xl font-display font-semibold text-foreground">Meus serviços</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Defina o que você oferece, seus dados e a disponibilidade da agenda.
        </p>
      </header>

      {/* Layout: nav de guias + conteúdo */}
      <div className="grid md:grid-cols-[220px_1fr] gap-5 md:gap-7 items-start">
        {/* Guias */}
        <nav className="md:sticky md:top-4 flex md:flex-col gap-1 p-2 bg-card rounded-2xl border border-border overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map(({ id, label, icon: Icon }) => {
            const activeTab = id === tab
            return (
              <Link
                key={id}
                href={id === 'servicos' ? '/servicos' : `/servicos?tab=${id}`}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm shrink-0 whitespace-nowrap transition-colors ${
                  activeTab ? 'font-semibold' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
                style={activeTab ? { background: terracotaMuted, color: terracota } : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Conteúdo */}
        <div className="min-w-0">
          {/* ── Serviços ── */}
          {tab === 'servicos' && (
            <section className="space-y-5">
              {/* Resumo */}
              <div className="grid grid-cols-3 gap-3">
                {stats.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-card rounded-xl border border-border p-4 flex flex-col gap-2">
                    <Icon className="w-4 h-4" style={{ color: terracota }} />
                    <div>
                      <p className="text-xl font-display font-semibold text-foreground leading-none tabular-nums">
                        {value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 leading-tight">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">Serviços oferecidos</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Pelo menos 1 ativo para que seus clientes possam agendar.
                </p>
              </div>

              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                {allServices.length > 0 ? (
                  <ul className="divide-y divide-border">
                    {allServices.map((svc) => (
                      <ServiceRow key={svc.id} svc={svc} />
                    ))}
                  </ul>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ background: terracotaSoft, color: terracota }}
                    >
                      <Scissors className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Nenhum serviço ainda</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                      Adicione seu primeiro serviço abaixo para liberar o link público de agendamento.
                    </p>
                  </div>
                )}

                {/* Adicionar serviço */}
                <div className="px-4 md:px-5 py-5 bg-secondary/40 border-t border-border">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Plus className="w-3.5 h-3.5" style={{ color: terracota }} />
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Adicionar serviço</p>
                  </div>
                  <form
                    action={async (fd) => { 'use server'; await createServiceFromServicos(fd) }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">Nome *</Label>
                        <Input name="name" placeholder="Drenagem linfática" required className="h-9 text-sm bg-card" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Duração (min)</Label>
                        <Input name="durationMin" type="number" defaultValue="60" min="15" step="15" className="h-9 text-sm bg-card" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Preço (R$)</Label>
                        <Input name="price" type="number" placeholder="—" step="0.01" className="h-9 text-sm bg-card" />
                      </div>
                    </div>
                    <Button type="submit" size="sm" className="h-9 text-xs gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar serviço
                    </Button>
                  </form>
                </div>
              </div>
            </section>
          )}

          {/* ── Negócio ── */}
          {tab === 'negocio' && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">Dados do negócio</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Informações exibidas para seus clientes ao se conectarem com você.
                </p>
              </div>
              <BusinessDataCard
                businessName={professional.businessName ?? ''}
                businessDescription={professional.businessDescription ?? ''}
                address={professional.address ?? ''}
                workingHours={professional.workingHours ?? ''}
                lunchBreak={professional.lunchBreak ?? ''}
              />
            </section>
          )}

          {/* ── Disponibilidade ── */}
          {tab === 'disponibilidade' && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">Horários indisponíveis</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Bloqueie dias ou intervalos específicos em que você não poderá atender.
                </p>
              </div>
              <BlockedTimesManager items={upcomingBlocked} />
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
