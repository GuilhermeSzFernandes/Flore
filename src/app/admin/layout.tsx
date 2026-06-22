import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { signOut } from '@/auth'
import Link from 'next/link'
import { LayoutDashboard, Users, LogOut, MessageSquareWarning, GitBranch } from 'lucide-react'

const navItems = [
  { href: '/admin',               label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/admin/profissionais', label: 'Profissionais',  icon: Users },
  { href: '/admin/indicacoes',    label: 'Indicações',     icon: GitBranch },
  { href: '/admin/feedback',      label: 'Feedback',       icon: MessageSquareWarning },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/login')

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-52 flex flex-col shrink-0 border-r border-border bg-card">
        <div className="px-5 pt-6 pb-5 border-b border-border">
          <p className="font-display italic text-xl text-primary">Flore</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-0.5">Painel Admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground px-3 pb-2">{session.user.email}</p>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }) }}>
            <button
              type="submit"
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-accent transition-colors w-full"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
