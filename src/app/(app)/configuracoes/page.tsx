import { auth } from '@/auth'
import { db } from '@/db'
import { professionals, services } from '@/db/schema'
import { eq, count } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User, Scissors, Gift, CreditCard, Palette } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createService, toggleService, ensureConnectCode, ensureReferralCode } from '@/actions/services'
import { getAppUrl } from '@/lib/app-url'
import ProfileForm from './ProfileForm'
import ReferralCodeCard from './ReferralCodeCard'
import VitrineLinkCard from './VitrineLinkCard'
import GalleryManager from './GalleryManager'

const planLabels: Record<string, string> = {
  beta: 'Beta', free: 'Gratuito', pro: 'Pro', clinic: 'Clínica',
}

const TABS = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'servicos', label: 'Serviços', icon: Scissors },
  { id: 'personalizacao', label: 'Personalização', icon: Palette },
  { id: 'indicacoes', label: 'Indicações', icon: Gift },
  { id: 'plano', label: 'Plano', icon: CreditCard },
] as const

type TabId = (typeof TABS)[number]['id']

const terracota = 'oklch(0.575 0.115 27)'
const terracotaMuted = 'oklch(0.575 0.115 27 / 10%)'

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: tabParam } = await searchParams
  const tab: TabId = (TABS.some((t) => t.id === tabParam) ? tabParam : 'perfil') as TabId

  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  let professional = await db.query.professionals.findFirst({
    where: eq(professionals.userId, session.user.id),
  })
  if (!professional) redirect('/onboarding')

  // Garante que profissionais antigas tenham os dois códigos
  if (!professional.connectCode) {
    professional = await ensureConnectCode(professional.id)
  }
  if (!professional.referralCode) {
    professional = await ensureReferralCode(professional.id)
  }

  // Consultas independentes em paralelo (evita round-trips sequenciais ao banco)
  const [[{ referralCount }], allServices, appUrl] = await Promise.all([
    db
      .select({ referralCount: count() })
      .from(professionals)
      .where(eq(professionals.referredById, professional.id)),
    db.query.services.findMany({
      where: eq(services.professionalId, professional.id),
      orderBy: (t, { asc }) => [asc(t.name)],
    }),
    getAppUrl(),
  ])
  const connectLink  = `${appUrl}/conectar/${professional.connectCode ?? ''}`
  const referralLink = `${appUrl}/registro?ref=${professional.referralCode ?? ''}`

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">Conta</p>
        <h1 className="text-3xl font-display font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Gerencie seus dados, serviços, indicações e plano.
        </p>
      </div>

      {/* Layout: nav lateral + conteúdo */}
      <div className="grid md:grid-cols-[220px_1fr] gap-5 md:gap-7 items-start">
        {/* Tabs */}
        <nav className="md:sticky md:top-4 flex md:flex-col gap-1 p-2 bg-card rounded-2xl border border-border overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = id === tab
            return (
              <Link
                key={id}
                href={id === 'perfil' ? '/configuracoes' : `/configuracoes?tab=${id}`}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm shrink-0 whitespace-nowrap transition-colors ${
                  active
                    ? 'font-semibold'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
                style={active ? { background: terracotaMuted, color: terracota } : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Conteúdo */}
        <div className="min-w-0">
          {/* ── Perfil ── */}
          {tab === 'perfil' && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">Meus dados</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Informações do seu perfil e link para clientes se conectarem.
                </p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6">
                <ProfileForm
                  displayName={professional.displayName}
                  phone={professional.phone ?? ''}
                  businessName={professional.businessName ?? ''}
                  address={professional.address ?? ''}
                  connectCode={professional.connectCode ?? ''}
                  connectLink={connectLink}
                  avatarUrl={professional.avatarUrl ?? null}
                />
              </div>
            </section>
          )}

          {/* ── Serviços ── */}
          {tab === 'servicos' && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">Serviços</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Pelo menos 1 ativo para o link público funcionar.
                </p>
              </div>
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                {allServices.length > 0 && (
                  <div className="divide-y divide-border">
                    {allServices.map((svc) => (
                      <div key={svc.id} className={`flex items-center gap-4 px-5 py-4 ${!svc.active ? 'opacity-40' : ''}`}>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{svc.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {svc.durationMin} min
                            {svc.priceInCents ? ` · R$ ${(svc.priceInCents / 100).toFixed(2).replace('.', ',')}` : ''}
                          </p>
                        </div>
                        <form action={async () => { 'use server'; await toggleService(svc.id, !svc.active) }}>
                          <Button type="submit" variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                            {svc.active ? 'Desativar' : 'Ativar'}
                          </Button>
                        </form>
                      </div>
                    ))}
                  </div>
                )}

                <div className="px-5 py-4 bg-secondary/40 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Adicionar serviço</p>
                  <form action={async (fd) => { 'use server'; await createService(fd) }} className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">Nome *</Label>
                        <Input name="name" placeholder="Drenagem linfática" required className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Duração (min)</Label>
                        <Input name="durationMin" type="number" defaultValue="60" min="15" step="15" className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Preço (R$)</Label>
                        <Input name="price" type="number" placeholder="—" step="0.01" className="h-9 text-sm" />
                      </div>
                    </div>
                    <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">Adicionar</Button>
                  </form>
                </div>
              </div>
            </section>
          )}

          {/* ── Personalização ── */}
          {tab === 'personalizacao' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">Personalize sua vitrine</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  O link e as fotos que seus clientes veem antes de agendar.
                </p>
              </div>

              <VitrineLinkCard slug={professional.slug} appUrl={appUrl} />

              <div>
                <h3 className="text-sm font-semibold text-foreground">Fotos do espaço</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Aparecem em um carrossel no topo da sua vitrine pública, acima do catálogo de serviços.
                </p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-5">
                <GalleryManager initialUrls={professional.galleryUrls ?? []} />
              </div>
            </section>
          )}

          {/* ── Indicações ── */}
          {tab === 'indicacoes' && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">Código de indicação</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Compartilhe este link para convidar outras profissionais para o beta. Cada cadastro feito com seu código é registrado.
                </p>
              </div>
              <ReferralCodeCard
                code={professional.referralCode ?? ''}
                link={referralLink}
                count={Number(referralCount)}
                proWeeks={professional.referralProWeeks}
              />
            </section>
          )}

          {/* ── Plano ── */}
          {tab === 'plano' && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">Plano</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Seu plano atual e benefícios.</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{planLabels[professional.plan]}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {professional.referralProWeeks > 0
                      ? `${professional.referralProWeeks} ${professional.referralProWeeks === 1 ? 'semana' : 'semanas'} de Pro aguardando lançamento`
                      : 'Indique profissionais para ganhar semanas de Pro'}
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled className="text-xs">
                  Upgrade em breve
                </Button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
