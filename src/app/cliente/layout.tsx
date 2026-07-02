import { Suspense } from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { signOut } from '@/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { Home, User } from 'lucide-react'
import FeedbackFAB from '@/components/FeedbackFAB'
import FloreLogo from '@/components/FloreLogo'
import FloreTour from '@/components/FloreTour'

const navItems = [
  { href: '/cliente/inicio', label: 'Início',     icon: Home },
  { href: '/cliente/ficha',  label: 'Meu perfil', icon: User },
]

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'patient') redirect('/login')

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header mobile / desktop */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-5 h-14 border-b border-border bg-background"
      >
        <FloreLogo size={24} textClassName="font-display italic text-xl" textColor="var(--primary)" />

        {/* Nav desktop */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Avatar className="w-7 h-7">
            <AvatarImage src={session.user.image ?? ''} />
            <AvatarFallback className="text-xs">
              {session.user.name?.slice(0, 2).toUpperCase() ?? 'CL'}
            </AvatarFallback>
          </Avatar>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }) }}>
            <button type="submit" className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Sair
            </button>
          </form>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      <FeedbackFAB />

      <Suspense fallback={null}>
        <FloreTour variant="patient" />
      </Suspense>

      {/* Nav mobile bottom */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-20 flex border-t border-border bg-background">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
