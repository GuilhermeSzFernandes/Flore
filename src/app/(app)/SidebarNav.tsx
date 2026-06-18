'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Users, Settings, Scissors } from 'lucide-react'

const navLinks = [
  { href: '/dashboard', label: 'Hoje', icon: LayoutDashboard },
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/servicos', label: 'Meus Serviços', icon: Scissors },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 space-y-0.5">
      {navLinks.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors"
            style={{
              color: 'var(--sidebar-foreground)',
              background: active ? 'var(--sidebar-accent)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-accent)'
            }}
            onMouseLeave={(e) => {
              if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
            }}
          >
            <Icon className="w-4 h-4 shrink-0 opacity-70" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
