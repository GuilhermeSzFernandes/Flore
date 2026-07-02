'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  Scissors,
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import FloreLogo from '@/components/FloreLogo'
import { signOutAction } from '@/actions/auth'

const navLinks = [
  { href: '/dashboard', label: 'Hoje', icon: LayoutDashboard },
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/servicos', label: 'Meus Serviços', icon: Scissors },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
  { href: '/suporte', label: 'Suporte', icon: LifeBuoy },
]

const planLabels: Record<string, string> = {
  beta: 'Beta',
  free: 'Gratuito',
  pro: 'Pro',
  clinic: 'Clínica',
}

// Tooltip que só aparece quando a sidebar está colapsada (hover no item).
function Tooltip({ label, show }: { label: string; show: boolean }) {
  if (!show) return null
  return (
    <span
      className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold opacity-0 transition-opacity duration-150 group-hover:opacity-100"
      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
    >
      {label}
    </span>
  )
}

export function Sidebar({
  displayName,
  plan,
  image,
}: {
  displayName: string
  plan: string
  image?: string | null
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCollapsed(localStorage.getItem('flore-sidebar-collapsed') === '1')
  }, [])

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem('flore-sidebar-collapsed', next ? '1' : '0')
      return next
    })
  }

  return (
    <aside
      className="relative hidden md:flex flex-col shrink-0 h-screen sticky top-0 transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
      style={{
        background: 'var(--sidebar)',
        width: collapsed ? 72 : 224,
        // evita "pulo" de largura antes de ler o localStorage
        visibility: mounted ? 'visible' : 'hidden',
      }}
    >
      {/* Toggle na borda */}
      <button
        onClick={toggle}
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        className="absolute -right-3 top-6 z-20 flex h-6 w-6 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm transition-colors hover:text-primary"
        style={{ borderColor: 'var(--border)' }}
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Logo */}
      <div className={`pt-7 pb-6 ${collapsed ? 'px-0 flex justify-center' : 'px-6'}`}>
        <FloreLogo
          size={28}
          showText={!collapsed}
          textClassName="font-display italic text-2xl tracking-tight"
          textColor="var(--sidebar-primary)"
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center rounded-md py-2.5 text-sm transition-colors ${
                collapsed ? 'justify-center px-2.5' : 'gap-3 px-3'
              }`}
              style={{
                color: active ? 'var(--sidebar-primary)' : 'var(--sidebar-foreground)',
                background: active ? 'var(--sidebar-accent)' : 'transparent',
                fontWeight: active ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'var(--sidebar-accent)'
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent'
              }}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? '' : 'opacity-70'}`} />
              {!collapsed && <span className="truncate">{label}</span>}
              <Tooltip label={label} show={collapsed} />
            </Link>
          )
        })}
      </nav>

      {/* Divisor */}
      <div className="px-4 py-3 opacity-20">
        <div className="border-t" style={{ borderColor: 'var(--sidebar-border)' }} />
      </div>

      {/* User footer */}
      <div className={`pb-4 ${collapsed ? 'px-2' : 'px-3'}`}>
        <div
          className={`group relative flex items-center rounded-md py-2 ${
            collapsed ? 'justify-center px-1' : 'gap-2.5 px-3'
          }`}
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold"
            style={{ background: 'var(--sidebar-accent)', color: 'var(--sidebar-foreground)' }}
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-full w-full object-cover" />
            ) : (
              displayName.slice(0, 2).toUpperCase()
            )}
          </span>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium" style={{ color: 'var(--sidebar-foreground)' }}>
                {displayName}
              </p>
              <p className="mt-0.5 text-[10px] opacity-50" style={{ color: 'var(--sidebar-foreground)' }}>
                {planLabels[plan] ?? plan}
              </p>
            </div>
          )}

          {!collapsed && (
            <form action={signOutAction}>
              <button
                type="submit"
                aria-label="Sair"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-destructive"
                style={{ color: 'var(--sidebar-foreground)' }}
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </form>
          )}

          <Tooltip label={displayName} show={collapsed} />
        </div>
      </div>
    </aside>
  )
}
