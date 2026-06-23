'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Users, Settings, Scissors } from 'lucide-react'

const navLinks = [
  { href: '/dashboard', label: 'Hoje',      icon: LayoutDashboard },
  { href: '/agenda',    label: 'Agenda',    icon: Calendar },
  { href: '/clientes',  label: 'Clientes',  icon: Users },
  { href: '/servicos',  label: 'Serviços',  icon: Scissors },
  { href: '/configuracoes', label: 'Config.', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex border-t"
      style={{
        background: 'var(--sidebar)',
        borderColor: 'var(--sidebar-border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {navLinks.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 pt-2.5 pb-2 transition-opacity"
            style={{
              color: active ? 'var(--sidebar-primary)' : 'var(--sidebar-foreground)',
              opacity: active ? 1 : 0.55,
            }}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
