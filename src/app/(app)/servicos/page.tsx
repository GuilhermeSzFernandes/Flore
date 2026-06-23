import { auth } from '@/auth'
import { db } from '@/db'
import { professionals, services } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  createServiceFromServicos,
  toggleServiceFromServicos,
  deleteServiceFromServicos,
} from '@/actions/services'
import { getUpcomingBlockedTimes } from '@/actions/blocked-times'
import BusinessDataCard from './BusinessDataCard'
import BlockedTimesManager from './BlockedTimesManager'

export default async function ServicosPage() {
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

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">Negócio</p>
        <h1 className="text-3xl font-display font-semibold text-foreground">Meus Serviços</h1>
      </div>

      {/* Dados do Negócio */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-1">Dados do negócio</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Informações exibidas para seus clientes ao se conectarem com você.
        </p>
        <BusinessDataCard
          businessName={professional.businessName ?? ''}
          businessDescription={professional.businessDescription ?? ''}
          address={professional.address ?? ''}
          workingHours={professional.workingHours ?? ''}
          lunchBreak={professional.lunchBreak ?? ''}
        />
      </section>

      {/* Serviços */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-1">Serviços oferecidos</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Pelo menos 1 ativo para que seus clientes possam agendar.
        </p>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {allServices.length > 0 && (
            <div className="divide-y divide-border">
              {allServices.map((svc) => (
                <div
                  key={svc.id}
                  className={`flex items-center gap-4 px-5 py-4 ${!svc.active ? 'opacity-40' : ''}`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{svc.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {svc.durationMin} min
                      {svc.priceInCents
                        ? ` · R$ ${(svc.priceInCents / 100).toFixed(2).replace('.', ',')}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <form
                      action={async () => {
                        'use server'
                        await toggleServiceFromServicos(svc.id, !svc.active)
                      }}
                    >
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground"
                      >
                        {svc.active ? 'Desativar' : 'Ativar'}
                      </Button>
                    </form>
                    {!svc.active && (
                      <form
                        action={async () => {
                          'use server'
                          await deleteServiceFromServicos(svc.id)
                        }}
                      >
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                        >
                          Excluir
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-5 py-4 bg-secondary/40 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Adicionar serviço
            </p>
            <form
              action={async (fd) => { 'use server'; await createServiceFromServicos(fd) }}
              className="space-y-3"
            >
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Nome *</Label>
                  <Input
                    name="name"
                    placeholder="Drenagem linfática"
                    required
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Duração (min)</Label>
                  <Input
                    name="durationMin"
                    type="number"
                    defaultValue="60"
                    min="15"
                    step="15"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Preço (R$)</Label>
                  <Input
                    name="price"
                    type="number"
                    placeholder="—"
                    step="0.01"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">
                Adicionar
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Bloqueios de agenda */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-1">Horários indisponíveis</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Bloqueie dias ou intervalos específicos em que você não poderá atender.
        </p>
        <BlockedTimesManager items={upcomingBlocked} />
      </section>
    </div>
  )
}
