'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ArrowLeftRight, Bell, MoreHorizontal } from 'lucide-react'

const TABS = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/movimentar', label: 'Movimentar', icon: ArrowLeftRight },
  { href: '/alertas', label: 'Alertas', icon: Bell },
  { href: '/mais', label: 'Mais', icon: MoreHorizontal },
]

interface BottomNavProps {
  alertasAtivos?: number
}

export function BottomNav({ alertasAtivos = 0 }: BottomNavProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/mais') {
      return ['/perdas', '/validades', '/giro', '/relatorios', '/usuarios', '/configuracoes'].some(p => pathname.startsWith(p))
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="bottom-nav hide-desktop">
      {TABS.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className={`bottom-nav-item ${isActive(href) ? 'active' : ''}`}>
          <div style={{ position: 'relative' }}>
            <Icon size={22} strokeWidth={isActive(href) ? 2.5 : 1.8} />
            {href === '/alertas' && alertasAtivos > 0 && (
              <span className="nav-dot" />
            )}
          </div>
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
