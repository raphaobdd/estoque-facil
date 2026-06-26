'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Check, EyeOff, ShoppingCart, AlertTriangle, Clock, TrendingDown, Package, ArrowRight } from 'lucide-react'
import type { Alerta, Produto } from '@/types'
import { calcularSugestaoCompra, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

const TIPO_CONFIG = {
  reposicao: { icon: <ShoppingCart size={18} />, color: 'var(--color-danger)', label: 'Reposição' },
  validade: { icon: <Clock size={18} />, color: 'var(--color-warning)', label: 'Validade' },
  parado: { icon: <Package size={18} />, color: 'var(--color-muted)', label: 'Parado' },
  perda: { icon: <TrendingDown size={18} />, color: 'var(--color-danger)', label: 'Perda' },
}

interface Props {
  alertas: (Alerta & { produto?: Produto })[]
  empresaId: string
}

export default function AlertasClient({ alertas: alertasIniciais, empresaId }: Props) {
  const supabase = createClient()
  const [alertas, setAlertas] = useState(alertasIniciais)
  const [filtro, setFiltro] = useState<'todos' | 'reposicao' | 'validade' | 'parado' | 'perda'>('todos')
  const [loading, setLoading] = useState<string | null>(null)

  async function resolverAlerta(id: string) {
    setLoading(id)
    await supabase.from('alertas').update({ status: 'resolvido', resolvido_em: new Date().toISOString() }).eq('id', id)
    setAlertas(prev => prev.filter(a => a.id !== id))
    setLoading(null)
  }

  async function ignorarAlerta(id: string) {
    setLoading(id)
    await supabase.from('alertas').update({ status: 'ignorado' }).eq('id', id)
    setAlertas(prev => prev.filter(a => a.id !== id))
    setLoading(null)
  }

  const alertasFiltrados = alertas.filter(a => filtro === 'todos' || a.tipo === filtro)
  const contadores = {
    todos: alertas.length,
    reposicao: alertas.filter(a => a.tipo === 'reposicao').length,
    validade: alertas.filter(a => a.tipo === 'validade').length,
    parado: alertas.filter(a => a.tipo === 'parado').length,
    perda: alertas.filter(a => a.tipo === 'perda').length,
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Alertas</h1>
        <p className="page-subtitle">
          {alertas.length === 0 ? 'Tudo em ordem por agora.' : `${alertas.length} alerta${alertas.length !== 1 ? 's' : ''} precisam de atenção.`}
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
        {(Object.entries(contadores) as [typeof filtro, number][]).map(([tipo, n]) => (
          <button
            key={tipo}
            className={`btn btn-sm ${filtro === tipo ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltro(tipo)}
          >
            {tipo === 'todos' ? 'Todos' : TIPO_CONFIG[tipo as keyof typeof TIPO_CONFIG].label}
            {n > 0 && <span className="badge" style={{ background: filtro === tipo ? 'rgba(255,255,255,0.3)' : 'var(--color-surface-2)', color: filtro === tipo ? 'white' : 'var(--color-text-soft)', marginLeft: 4, padding: '1px 6px' }}>{n}</span>}
          </button>
        ))}
      </div>

      {alertasFiltrados.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Bell size={28} /></div>
            <p className="empty-state-title">Nenhum alerta</p>
            <p className="empty-state-desc">
              {filtro === 'todos' ? 'Seu estoque está em dia! Nenhum alerta ativo.' : 'Nenhum alerta desse tipo.'}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {alertasFiltrados.map(alerta => {
            const cfg = TIPO_CONFIG[alerta.tipo as keyof typeof TIPO_CONFIG]
            const produto = alerta.produto as Produto | undefined
            const sugestao = produto && alerta.tipo === 'reposicao'
              ? calcularSugestaoCompra(produto.estoque_minimo, produto.estoque_atual)
              : null

            return (
              <div key={alerta.id} className="card" style={{ borderLeft: `3px solid ${cfg.color}` }}>
                <div className="card-body" style={{ padding: 'var(--space-4) var(--space-5)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-lg)', background: cfg.color + '15', color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                        <span className="badge" style={{ background: cfg.color + '15', color: cfg.color }}>{cfg.label}</span>
                      </div>
                      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', fontWeight: 500, lineHeight: 1.5 }}>{alerta.mensagem}</p>

                      {/* Info de reposição */}
                      {produto && alerta.tipo === 'reposicao' && (
                        <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                          <span className="badge badge-danger">Atual: {produto.estoque_atual} {produto.unidade_medida}</span>
                          <span className="badge badge-muted">Mínimo: {produto.estoque_minimo} {produto.unidade_medida}</span>
                          {sugestao !== null && sugestao > 0 && (
                            <span className="badge badge-primary">Comprar ~{sugestao} {produto.unidade_medida}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', justifyContent: 'flex-end' }}>
                    {produto && (
                      <Link
                        href={`/movimentar?tipo=entrada`}
                        className="btn btn-sm btn-success"
                      >
                        <ShoppingCart size={14} /> Registrar entrada
                      </Link>
                    )}
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => ignorarAlerta(alerta.id)}
                      disabled={loading === alerta.id}
                    >
                      <EyeOff size={14} /> Ignorar
                    </button>
                    <button
                      id={`btn-resolver-${alerta.id}`}
                      className="btn btn-sm btn-secondary"
                      onClick={() => resolverAlerta(alerta.id)}
                      disabled={loading === alerta.id}
                    >
                      {loading === alerta.id ? <span className="spinner" /> : <><Check size={14} /> Resolver</>}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
