import { auth } from '@/auth'
import { db } from '@/db'
import { professionals } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { signOut } from '@/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut } from 'lucide-react'
import { SidebarNav } from './SidebarNav'
import { BottomNav } from './BottomNav'
import FeedbackFAB from '@/components/FeedbackFAB'

const planLabels: Record<string, string> = {
  beta:   'Beta',
  free:   'Gratuito',
  pro:    'Pro',
  clinic: 'Clínica',
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const professional = await db.query.professionals.findFirst({
    where: eq(professionals.userId, session.user.id),
  })
  if (!professional) redirect('/onboarding')

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — visível apenas em md+ */}
      <aside className="hidden md:flex w-56 flex-col shrink-0 h-screen sticky top-0" style={{ background: 'var(--sidebar)' }}>

        {/* Wordmark */}
        <div className="px-6 pt-7 pb-6">
          <span
            className="font-display italic text-2xl tracking-tight"
            style={{ color: 'var(--sidebar-primary)' }}
          >
            Flore
          </span>
        </div>

        {/* Nav */}
        <SidebarNav />

        {/* Divisor */}
        <div className="px-6 py-3 opacity-20">
          <div className="border-t" style={{ borderColor: 'var(--sidebar-border)' }} />
        </div>

        {/* User footer */}
        <div className="px-3 pb-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md transition-colors text-left"
              style={{ color: 'var(--sidebar-foreground)' }}
            >
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarImage src={session.user.image ?? ''} />
                <AvatarFallback
                  className="text-xs font-medium"
                  style={{ background: 'var(--sidebar-accent)', color: 'var(--sidebar-foreground)' }}
                >
                  {professional.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--sidebar-foreground)' }}>
                  {professional.displayName}
                </p>
                <p className="text-[10px] mt-0.5 opacity-50">{planLabels[professional.plan]}</p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" className="w-48">
              <DropdownMenuItem>
                <form
                  action={async () => {
                    'use server'
                    await signOut({ redirectTo: '/login' })
                  }}
                  className="w-full"
                >
                  <button type="submit" className="flex items-center gap-2 w-full text-sm text-destructive">
                    <LogOut className="w-3.5 h-3.5" />
                    Sair
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Coluna direita — ocupa toda a tela no mobile */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Header mobile — oculto em md+ */}
        <header
          className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-13 border-b border-border bg-background shrink-0"
        >
          <span
            className="font-display italic text-xl tracking-tight"
            style={{ color: 'var(--primary)' }}
          >
            Flore
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="w-8 h-8">
                <AvatarImage src={session.user.image ?? ''} />
                <AvatarFallback
                  className="text-xs font-medium"
                  style={{ background: 'var(--sidebar)', color: 'var(--sidebar-foreground)' }}
                >
                  {professional.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-48">
              <div className="px-3 py-2 border-b border-border mb-1">
                <p className="text-xs font-medium truncate">{professional.displayName}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{planLabels[professional.plan]}</p>
              </div>
              <DropdownMenuItem>
                <form
                  action={async () => {
                    'use server'
                    await signOut({ redirectTo: '/login' })
                  }}
                  className="w-full"
                >
                  <button type="submit" className="flex items-center gap-2 w-full text-sm text-destructive">
                    <LogOut className="w-3.5 h-3.5" />
                    Sair
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Conteúdo — padding bottom no mobile para não ficar atrás do bottom nav */}
        <main className="flex-1 min-h-0 overflow-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom nav — apenas mobile */}
      <BottomNav />

      <FeedbackFAB />
    </div>
  )
}
