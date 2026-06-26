'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ArrowLeftRight, Bell, MoreHorizontal,
  TrendingDown, Calendar, RotateCcw, FileText, Users, Settings,
  LogOut, ChevronLeft, X
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const MAIS_ITEMS = [
  { href: '/perdas', label: 'Perdas', icon: TrendingDown },
  { href: '/validades', label: 'Validades', icon: Calendar },
  { href: '/giro', label: 'Giro', icon: RotateCcw },
  { href: '/relatorios', label: 'Relatórios', icon: FileText },
  { href: '/usuarios', label: 'Usuários', icon: Users },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export default function MaisPage() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Menu</h1>
        <p className="page-subtitle">Acesse relatórios, configurações e mais.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {MAIS_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
              padding: 'var(--space-4) var(--space-5)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              textDecoration: 'none',
              color: 'var(--color-text)',
              fontWeight: 500,
              transition: 'all 0.15s',
            }}
          >
            <div style={{ width: 40, height: 40, background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-soft)' }}>
              <Icon size={20} />
            </div>
            {label}
            <ChevronLeft size={16} style={{ marginLeft: 'auto', transform: 'rotate(180deg)', color: 'var(--color-text-muted)' }} />
          </Link>
        ))}

        <div style={{ marginTop: 'var(--space-4)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
              padding: 'var(--space-4) var(--space-5)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              color: 'var(--color-danger)',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ width: 40, height: 40, background: 'var(--color-danger-light)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={20} />
            </div>
            Sair
          </button>
        </div>
      </div>
    </>
  )
}
