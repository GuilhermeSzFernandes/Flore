'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Users, Settings, Scissors, LifeBuoy } from 'lucide-react'

const navLinks = [
  { href: '/dashboard', label: 'Hoje', icon: LayoutDashboard },
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/servicos', label: 'Serviços', icon: Scissors },
  { href: '/configuracoes', label: 'Config.', icon: Settings },
  { href: '/suporte', label: 'Ajuda', icon: LifeBuoy },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed left-3 right-3 bottom-3 z-30 flex items-center justify-around gap-1 rounded-[20px] border px-2 py-2"
      style={{
        background: 'color-mix(in srgb, var(--sidebar) 90%, transparent)',
        borderColor: 'var(--sidebar-border)',
        boxShadow: '0 18px 48px rgba(15, 23, 42, 0.28)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        paddingBottom: `calc(0.5rem + env(safe-area-inset-bottom) * 0.5)`,
      }}
    >
      {navLinks.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className="flex h-11 flex-1 flex-col items-center justify-center gap-1 rounded-[14px] transition-colors"
            style={
              active
                ? { background: 'var(--sidebar-accent)', color: 'var(--sidebar-primary)' }
                : { color: 'var(--sidebar-foreground)', opacity: 0.6 }
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="text-[9px] font-medium leading-none">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
