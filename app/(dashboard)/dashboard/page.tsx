import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getGreeting, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import {
  AlertTriangle, Package, TrendingDown, BarChart3,
  TrendingUp, ArrowLeftRight, Minus, RefreshCw
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfis')
    .select('nome, empresa_id, empresa:empresas(nome)')
    .eq('id', user.id)
    .single()

  if (!perfil?.empresa_id) redirect('/onboarding')
  const eid = perfil.empresa_id

  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
  const trinta = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // === Paralelizar todas as queries ===
  const [
    { data: produtos },
    { data: movRecentes },
    { data: perdasMes },
    { data: alertas },
  ] = await Promise.all([
    supabase
      .from('produtos')
      .select('id, nome, estoque_atual, estoque_minimo, unidade_medida, custo_unitario, categoria:categorias(nome)')
      .eq('empresa_id', eid)
      .eq('ativo', true),

    supabase
      .from('movimentacoes')
      .select('produto_id')
      .eq('empresa_id', eid)
      .in('tipo', ['saida', 'perda'])
      .gte('data_movimentacao', trinta),

    supabase
      .from('movimentacoes')
      .select('quantidade, custo_unitario_momento')
      .eq('empresa_id', eid)
      .eq('tipo', 'perda')
      .gte('data_movimentacao', inicioMes),

    supabase
      .from('alertas')
      .select('id, tipo, mensagem, criado_em')
      .eq('empresa_id', eid)
      .eq('status', 'ativo')
      .order('criado_em', { ascending: false })
      .limit(6),
  ])

  const produtosList = produtos ?? []
  const paraRepor = produtosList.filter(p => p.estoque_atual <= p.estoque_minimo)

  const idsComSaida = new Set((movRecentes ?? []).map((m: { produto_id: string }) => m.produto_id))
  const produtosParados = produtosList.filter(p => !idsComSaida.has(p.id) && p.estoque_atual > 0)

  const totalPerdasQtd = (perdasMes ?? []).reduce((a: number, m: { quantidade: number }) => a + m.quantidade, 0)
  const totalPerdasValor = (perdasMes ?? []).reduce((a: number, m: { quantidade: number; custo_unitario_momento: number | null }) => a + m.quantidade * (m.custo_unitario_momento ?? 0), 0)

  const totalItens = produtosList.reduce((a, p) => a + p.estoque_atual, 0)
  const totalValor = produtosList.reduce((a, p) => a + p.estoque_atual * (p.custo_unitario ?? 0), 0)

  const ALERT_COLORS: Record<string, string> = {
    reposicao: 'var(--color-danger)',
    validade: 'var(--color-warning)',
    parado: 'var(--color-muted)',
    perda: 'var(--color-danger)',
  }

  const greeting = getGreeting()
  const nome = perfil.nome.split(' ')[0]

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">{greeting}, {nome}.</h1>
        <p className="page-subtitle">Veja o que precisa de atenção hoje.</p>
      </div>

      {/* Stats cards */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--color-danger-light)' }}>
            <AlertTriangle size={22} color="var(--color-danger)" />
          </div>
          <div className="stat-card-value" style={{ color: paraRepor.length > 0 ? 'var(--color-danger)' : 'var(--color-text)' }}>
            {paraRepor.length}
          </div>
          <div className="stat-card-label">Para repor</div>
          <div className="stat-card-sub">
            <Link href="/alertas" style={{ color: 'var(--color-primary)', fontWeight: 500, fontSize: 'var(--font-size-xs)' }}>
              Ver produtos →
            </Link>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--color-warning-light)' }}>
            <Package size={22} color="var(--color-warning)" />
          </div>
          <div className="stat-card-value">{produtosParados.length}</div>
          <div className="stat-card-label">Parados +30 dias</div>
          <div className="stat-card-sub">
            <Link href="/giro" style={{ color: 'var(--color-primary)', fontWeight: 500, fontSize: 'var(--font-size-xs)' }}>
              Ver parados →
            </Link>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--color-danger-light)' }}>
            <TrendingDown size={22} color="var(--color-danger)" />
          </div>
          <div className="stat-card-value">{Math.round(totalPerdasQtd)}</div>
          <div className="stat-card-label">Perdas no mês</div>
          {totalPerdasValor > 0 && (
            <div className="stat-card-sub" style={{ color: 'var(--color-danger)' }}>
              {formatCurrency(totalPerdasValor)} perdido
            </div>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--color-primary-light)' }}>
            <BarChart3 size={22} color="var(--color-primary)" />
          </div>
          <div className="stat-card-value">{Math.round(totalItens)}</div>
          <div className="stat-card-label">Itens em estoque</div>
          {totalValor > 0 && (
            <div className="stat-card-sub">{formatCurrency(totalValor)} em valor</div>
          )}
        </div>
      </div>

      {/* Ações rápidas */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--color-text)' }}>
          Ações rápidas
        </h2>
        <div className="quick-actions">
          {[
            { href: '/movimentar?tipo=entrada', label: 'Registrar entrada', color: 'var(--color-success-light)', iconColor: 'var(--color-success)', icon: <TrendingUp size={22} /> },
            { href: '/movimentar?tipo=saida', label: 'Registrar saída', color: 'var(--color-primary-light)', iconColor: 'var(--color-primary)', icon: <ArrowLeftRight size={22} /> },
            { href: '/movimentar?tipo=perda', label: 'Registrar perda', color: 'var(--color-danger-light)', iconColor: 'var(--color-danger)', icon: <Minus size={22} /> },
            { href: '/movimentar?tipo=ajuste', label: 'Fazer contagem', color: 'var(--color-warning-light)', iconColor: 'var(--color-warning)', icon: <RefreshCw size={22} /> },
          ].map(({ href, label, color, iconColor, icon }) => (
            <Link key={href} href={href} className="quick-action-btn" id={`btn-${label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="action-icon" style={{ background: color, color: iconColor }}>
                {icon}
              </div>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Atenção hoje */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700 }}>Atenção hoje</h2>
          <Link href="/alertas" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 500 }}>
            Ver todos
          </Link>
        </div>
        <div className="card-body" style={{ gap: 0, padding: 'var(--space-4) var(--space-5)' }}>
          {(alertas ?? []).length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state-icon">
                <Package size={28} />
              </div>
              <p className="empty-state-title">Nenhum alerta</p>
              <p className="empty-state-desc">Tudo certo com seu estoque por enquanto!</p>
            </div>
          ) : (
            (alertas ?? []).map((alerta: { id: string; tipo: string; mensagem: string; criado_em: string }) => (
              <div key={alerta.id} className="alert-item">
                <div className="alert-item-dot" style={{ background: ALERT_COLORS[alerta.tipo] ?? 'var(--color-muted)' }} />
                <div className="alert-item-content">
                  <p className="alert-item-msg">{alerta.mensagem}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {paraRepor.length > 0 && (
          <>
            <div className="divider" style={{ margin: 0 }} />
            <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
              <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-3)' }}>
                Produtos abaixo do mínimo
              </p>
              {paraRepor.slice(0, 3).map((p: { id: string; nome: string; estoque_atual: number; estoque_minimo: number; unidade_medida: string }) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>{p.nome}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span className="badge badge-danger">{p.estoque_atual} {p.unidade_medida}</span>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>mín: {p.estoque_minimo}</span>
                  </div>
                </div>
              ))}
              {paraRepor.length > 3 && (
                <Link href="/alertas" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 500, display: 'block', marginTop: 'var(--space-3)' }}>
                  +{paraRepor.length - 3} outros produtos →
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}