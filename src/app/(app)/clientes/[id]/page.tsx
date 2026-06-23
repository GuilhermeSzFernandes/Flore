import { auth } from '@/auth'
import { db } from '@/db'
import { patients, professionals, restrictions, appointments, sessionNotes } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { redirect, notFound } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RestrictionChip } from '@/components/RestrictionChip'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateClient, updateSensitivities, addRestriction, deactivateRestriction } from '@/actions/clients'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, Cake, X } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const professional = await db.query.professionals.findFirst({
    where: eq(professionals.userId, session.user.id),
  })
  if (!professional) redirect('/onboarding')

  const client = await db.query.patients.findFirst({
    where: and(eq(patients.id, id), eq(patients.professionalId, professional.id)),
  })
  if (!client) notFound()

  const [activeRestrictions, doneAppointments] = await Promise.all([
    db.query.restrictions.findMany({
      where: and(eq(restrictions.patientId, id), eq(restrictions.active, true)),
    }),
    db.query.appointments.findMany({
      where: and(eq(appointments.patientId, id), eq(appointments.status, 'done')),
      orderBy: [desc(appointments.startsAt)],
    }),
  ])

  const sessionHistory = await Promise.all(
    doneAppointments.map(async (apt) => ({
      apt,
      note: await db.query.sessionNotes.findFirst({ where: eq(sessionNotes.appointmentId, apt.id) }),
    })),
  )

  const phoneFormatted = client.phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <Link href="/clientes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Clientes
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-display font-semibold text-foreground">{client.name}</h1>
        <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{phoneFormatted}</span>
          {client.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{client.email}</span>}
          {client.birthDate && (
            <span className="flex items-center gap-1">
              <Cake className="w-3.5 h-3.5" />
              {format(new Date(client.birthDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          )}
        </div>
        {activeRestrictions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {activeRestrictions.map((r) => <RestrictionChip key={r.id} technique={r.technique} />)}
          </div>
        )}
      </div>

      <Tabs defaultValue="dados">
        <TabsList className="mb-5">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="restricoes">
            Restrições {activeRestrictions.length > 0 && `(${activeRestrictions.length})`}
          </TabsTrigger>
          <TabsTrigger value="sensibilidades">Sensibilidades</TabsTrigger>
          <TabsTrigger value="historico">Histórico {doneAppointments.length > 0 && `(${doneAppointments.length})`}</TabsTrigger>
        </TabsList>

        {/* Dados */}
        <TabsContent value="dados">
          <div className="bg-card rounded-xl border border-border p-6">
            <form action={async (fd) => { 'use server'; await updateClient(id, fd) }} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Nome *</Label>
                  <Input name="name" defaultValue={client.name} required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Telefone *</Label>
                  <Input name="phone" defaultValue={client.phone} required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">E-mail</Label>
                  <Input name="email" type="email" defaultValue={client.email ?? ''} className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Nascimento</Label>
                  <Input name="birthDate" type="date" defaultValue={client.birthDate ?? ''} className="h-10" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-sm font-medium">Observações gerais</Label>
                  <Textarea name="notes" rows={3} defaultValue={client.notes ?? ''} className="resize-none" />
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <Button type="submit" size="sm">Salvar alterações</Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* Restrições */}
        <TabsContent value="restricoes">
          <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
            {activeRestrictions.length > 0 ? (
              activeRestrictions.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-destructive">{r.technique}</p>
                    {r.reason && <p className="text-xs text-muted-foreground mt-0.5">{r.reason}</p>}
                  </div>
                  <form action={async () => { 'use server'; await deactivateRestriction(r.id, id) }}>
                    <Button type="submit" variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </form>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center px-5">Nenhuma restrição registrada.</p>
            )}

            <div className="p-5 bg-secondary/40">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Adicionar restrição</p>
              <form action={async (fd) => { 'use server'; await addRestriction(id, fd) }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input name="technique" placeholder="Técnica (ex: Ventosaterapia)" required className="h-9 text-sm" />
                  <Input name="reason" placeholder="Motivo (opcional)" className="h-9 text-sm" />
                </div>
                <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">Registrar</Button>
              </form>
            </div>
          </div>
        </TabsContent>

        {/* Sensibilidades */}
        <TabsContent value="sensibilidades">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <p className="text-sm font-medium text-foreground">Sensibilidades emocionais</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                Confidencial
              </span>
            </div>
            <form action={async (fd) => { 'use server'; await updateSensitivities(id, fd) }} className="space-y-4">
              <Textarea
                name="sensitivities"
                rows={5}
                defaultValue={client.sensitivities ?? ''}
                placeholder="Sensibilidades emocionais, traumas relevantes, preferências de toque, contextos que requerem atenção..."
                className="resize-none text-sm"
              />
              <Button type="submit" size="sm">Salvar</Button>
            </form>
          </div>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="historico">
          {sessionHistory.length === 0 ? (
            <div className="bg-card rounded-xl border border-border py-16 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma sessão concluída ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessionHistory.map(({ apt, note }) => (
                <div key={apt.id} className="bg-card rounded-xl border border-border p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground font-display">
                      {format(apt.startsAt, "d 'de' MMMM yyyy", { locale: ptBR })}
                    </p>
                    <span className="text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">
                      {apt.serviceName}
                    </span>
                  </div>
                  {note && (
                    <div className="space-y-2">
                      <p className="text-sm text-foreground">{note.whatWasDone}</p>
                      {note.areasTreated && note.areasTreated.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {note.areasTreated.map((area) => (
                            <span key={area} className="text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground border border-border">{area}</span>
                          ))}
                        </div>
                      )}
                      {(note.painBefore !== null || note.painAfter !== null) && (
                        <p className="text-xs text-muted-foreground">
                          Dor: {note.painBefore ?? '—'}/10 → {note.painAfter ?? '—'}/10
                        </p>
                      )}
                      {note.observations && (
                        <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-3">{note.observations}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
