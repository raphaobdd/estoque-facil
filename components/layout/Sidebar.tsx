'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Package, LayoutDashboard, ArrowLeftRight, Bell,
  BarChart3, Users, Settings, HelpCircle, LogOut,
  TrendingDown, Calendar, RotateCcw, FileText, ChevronDown
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/movimentar', label: 'Movimentar', icon: ArrowLeftRight },
  { href: '/alertas', label: 'Alertas', icon: Bell },
]

const MORE_ITEMS = [
  { href: '/perdas', label: 'Perdas', icon: TrendingDown },
  { href: '/validades', label: 'Validades', icon: Calendar },
  { href: '/giro', label: 'Giro', icon: RotateCcw },
  { href: '/relatorios', label: 'Relatórios', icon: FileText },
  { href: '/usuarios', label: 'Usuários', icon: Users },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

interface SidebarProps {
  nomeEmpresa: string
  nomeUsuario: string
  alertasAtivos?: number
}

export function Sidebar({ nomeEmpresa, nomeUsuario, alertasAtivos = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [moreExpanded, setMoreExpanded] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <aside className="sidebar hide-mobile">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Package size={18} strokeWidth={2.5} />
        </div>
        <div>
          <div className="sidebar-logo-text">Estoque Fácil</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{nomeEmpresa}</div>
        </div>
      </div>

      {/* Nav principal */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Principal</span>

        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-link ${isActive(href) ? 'active' : ''}`}
          >
            <Icon className="nav-icon" />
            <span>{label}</span>
            {href === '/alertas' && alertasAtivos > 0 && (
              <span className="sidebar-badge">{alertasAtivos > 99 ? '99+' : alertasAtivos}</span>
            )}
          </Link>
        ))}

        <span className="sidebar-section-label" style={{ marginTop: 'var(--space-2)' }}>Análises</span>

        <button
          className="sidebar-link"
          style={{ width: '100%', background: 'none', cursor: 'pointer' }}
          onClick={() => setMoreExpanded(!moreExpanded)}
        >
          <BarChart3 className="nav-icon" />
          <span>Mais</span>
          <ChevronDown
            size={14}
            style={{ marginLeft: 'auto', transform: moreExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          />
        </button>

        {moreExpanded && MORE_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`sidebar-link ${isActive(href) ? 'active' : ''}`}
            style={{ paddingLeft: 'var(--space-8)', fontSize: 'var(--font-size-xs)' }}
          >
            <Icon className="nav-icon" style={{ width: 15, height: 15 }} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 'var(--font-size-sm)', flexShrink: 0 }}>
            {nomeUsuario.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nomeUsuario}</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.5)' }}>Admin</div>
          </div>
        </div>
        <button className="sidebar-link" style={{ width: '100%', color: '#FCA5A5', cursor: 'pointer' }} onClick={handleLogout}>
          <LogOut className="nav-icon" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}