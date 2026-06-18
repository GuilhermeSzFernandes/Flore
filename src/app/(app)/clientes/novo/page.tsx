import { auth } from '@/auth'
import { db } from '@/db'
import { professionals } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { createClient } from '@/actions/clients'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button, buttonVariants } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NovoClientePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const professional = await db.query.professionals.findFirst({
    where: eq(professionals.userId, session.user.id),
  })
  if (!professional) redirect('/onboarding')

  return (
    <div className="p-8 max-w-xl mx-auto">
      <Link href="/clientes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Clientes
      </Link>

      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">Novo</p>
        <h1 className="text-3xl font-display font-semibold text-foreground">Cadastrar cliente</h1>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <form action={async (fd) => { 'use server'; await createClient(fd) }} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-medium">Nome completo *</Label>
              <Input name="name" placeholder="Maria da Silva" required className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Telefone / WhatsApp *</Label>
              <Input name="phone" placeholder="(11) 99999-0000" type="tel" required className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Data de nascimento</Label>
              <Input name="birthDate" type="date" className="h-10" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-medium">E-mail</Label>
              <Input name="email" type="email" placeholder="maria@email.com" className="h-10" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-medium">Observações gerais</Label>
              <Textarea name="notes" placeholder="Preferências, histórico de atendimentos..." rows={3} className="resize-none" />
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
            <Link href="/clientes" className={buttonVariants({ variant: 'outline' }) + ' flex-1 text-center justify-center'}>
              Cancelar
            </Link>
            <Button type="submit" className="flex-1">
              Cadastrar cliente
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
