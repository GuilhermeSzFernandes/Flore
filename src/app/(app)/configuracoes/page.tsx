import { auth } from '@/auth'
import { db } from '@/db'
import { professionals, services } from '@/db/schema'
import { eq, count } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createService, toggleService, ensureConnectCode, ensureReferralCode } from '@/actions/services'
import { getAppUrl } from '@/lib/app-url'
import ProfileForm from './ProfileForm'
import ReferralCodeCard from './ReferralCodeCard'

const planLabels: Record<string, string> = {
  beta: 'Beta', free: 'Gratuito', pro: 'Pro', clinic: 'Clínica',
}

export default async function ConfiguracoesPage() {
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

  // Contagem de profissionais indicadas por esta
  const [{ referralCount }] = await db
    .select({ referralCount: count() })
    .from(professionals)
    .where(eq(professionals.referredById, professional.id))

  const allServices = await db.query.services.findMany({
    where: eq(services.professionalId, professional.id),
    orderBy: (t, { asc }) => [asc(t.name)],
  })

  const appUrl       = await getAppUrl()
  const connectLink  = `${appUrl}/conectar/${professional.connectCode ?? ''}`
  const referralLink = `${appUrl}/registro?ref=${professional.referralCode ?? ''}`

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">Conta</p>
        <h1 className="text-3xl font-display font-semibold text-foreground">Configurações</h1>
      </div>

      {/* Dados */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-4">Meus dados</h2>
        <div className="bg-card rounded-xl border border-border p-6">
          <ProfileForm
            displayName={professional.displayName}
            phone={professional.phone ?? ''}
            businessName={professional.businessName ?? ''}
            address={professional.address ?? ''}
            connectCode={professional.connectCode ?? ''}
            connectLink={connectLink}
          />
        </div>
      </section>

      {/* Serviços */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-1">Serviços</h2>
        <p className="text-xs text-muted-foreground mb-4">Pelo menos 1 ativo para o link público funcionar.</p>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
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

      {/* Indicações */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-1">Código de indicação</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Compartilhe este link para convidar outras profissionais para o beta. Cada cadastro feito com seu código é registrado.
        </p>
        <ReferralCodeCard
          code={professional.referralCode ?? ''}
          link={referralLink}
          count={Number(referralCount)}
          proWeeks={professional.referralProWeeks}
        />
      </section>

      {/* Plano */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-4">Plano</h2>
        <div className="bg-card rounded-xl border border-border p-6 flex items-center justify-between">
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
    </div>
  )
}
