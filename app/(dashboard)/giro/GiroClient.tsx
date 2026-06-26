'use client'

import { useState, useMemo } from 'react'
import { RotateCcw, TrendingUp, Minus, Clock, AlertCircle } from 'lucide-react'
import type { Produto, ClassificacaoGiro } from '@/types'
import { calcularClassificacaoGiro, gerarSugestaoGiro } from '@/lib/utils'

const CLASSIFICACAO_CONFIG = {
  alto: { label: 'Alto', color: 'var(--color-success)', bg: 'var(--color-success-light)', icon: <TrendingUp size={14} /> },
  normal: { label: 'Normal', color: 'var(--color-primary)', bg: 'var(--color-primary-light)', icon: <RotateCcw size={14} /> },
  baixo: { label: 'Baixo', color: 'var(--color-warning)', bg: 'var(--color-warning-light)', icon: <Minus size={14} /> },
  parado: { label: 'Parado', color: 'var(--color-muted)', bg: 'var(--color-surface-2)', icon: <Clock size={14} /> },
}

const PERIODOS = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
]

interface Movimento { produto_id: string; quantidade: number; data_movimentacao: string }

interface Props {
  produtos: Produto[]
  movimentos: Movimento[]
}

export default function GiroClient({ produtos, movimentos }: Props) {
  const [periodo, setPeriodo] = useState(30)
  const [filtroGiro, setFiltroGiro] = useState<ClassificacaoGiro | 'todos'>('todos')

  const dataLimite = useMemo(() => {
    return new Date(Date.now() - periodo * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }, [periodo])

  const produtosGiro = useMemo(() => {
    return produtos.map(produto => {
      const movProduto = movimentos.filter(m =>
        m.produto_id === produto.id && m.data_movimentacao >= dataLimite
      )
      const totalSaidas = movProduto.reduce((a, m) => a + m.quantidade, 0)

      const ultimaSaida = movimentos
        .filter(m => m.produto_id === produto.id)
        .sort((a, b) => b.data_movimentacao.localeCompare(a.data_movimentacao))[0]

      const diasSemSaida = ultimaSaida
        ? Math.floor((Date.now() - new Date(ultimaSaida.data_movimentacao + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24))
        : 999

      const classificacao = calcularClassificacaoGiro(totalSaidas, diasSemSaida, periodo)
      const sugestao = gerarSugestaoGiro(produto, classificacao, diasSemSaida)

      return { ...produto, totalSaidas, diasSemSaida, classificacao, sugestao }
    }).sort((a, b) => b.totalSaidas - a.totalSaidas)
  }, [produtos, movimentos, dataLimite, periodo])

  const contadores = {
    todos: produtosGiro.length,
    alto: produtosGiro.filter(p => p.classificacao === 'alto').length,
    normal: produtosGiro.filter(p => p.classificacao === 'normal').length,
    baixo: produtosGiro.filter(p => p.classificacao === 'baixo').length,
    parado: produtosGiro.filter(p => p.classificacao === 'parado').length,
  }

  const produtosFiltrados = filtroGiro === 'todos'
    ? produtosGiro
    : produtosGiro.filter(p => p.classificacao === filtroGiro)

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Giro de Produtos</h1>
        <p className="page-subtitle">Veja quais produtos têm mais e menos saídas.</p>
      </div>

      {/* Controles */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 3 }}>
          {PERIODOS.map(({ label, value }) => (
            <button
              key={value}
              className={`btn btn-sm ${periodo === value ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setPeriodo(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {(['todos', 'alto', 'normal', 'baixo', 'parado'] as const).map(g => {
            const cfg = g !== 'todos' ? CLASSIFICACAO_CONFIG[g] : null
            return (
              <button
                key={g}
                className={`btn btn-sm ${filtroGiro === g ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFiltroGiro(g)}
              >
                {g === 'todos' ? 'Todos' : cfg?.label}
                <span style={{ marginLeft: 4, opacity: 0.7 }}>({contadores[g]})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Cards de resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        {(['alto', 'normal', 'baixo', 'parado'] as ClassificacaoGiro[]).map(g => {
          const cfg = CLASSIFICACAO_CONFIG[g]
          return (
            <div key={g} className="stat-card" style={{ cursor: 'pointer', borderColor: filtroGiro === g ? cfg.color : undefined }} onClick={() => setFiltroGiro(g)}>
              <div className="stat-card-icon" style={{ background: cfg.bg }}>
                <span style={{ color: cfg.color }}>{cfg.icon}</span>
              </div>
              <div className="stat-card-value" style={{ color: cfg.color }}>{contadores[g]}</div>
              <div className="stat-card-label">Giro {cfg.label}</div>
            </div>
          )
        })}
      </div>

      {/* Lista */}
      <div className="table-container">
        {produtosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><RotateCcw size={28} /></div>
            <p className="empty-state-title">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Estoque</th>
                  <th>Saídas ({periodo}d)</th>
                  <th>Dias sem saída</th>
                  <th>Giro</th>
                  <th>Sugestão</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map(p => {
                  const cfg = CLASSIFICACAO_CONFIG[p.classificacao]
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.nome}</td>
                      <td style={{ color: p.estoque_atual <= p.estoque_minimo ? 'var(--color-danger)' : 'var(--color-text)' }}>
                        {p.estoque_atual} {p.unidade_medida}
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.totalSaidas || '0'}</td>
                      <td style={{ color: p.diasSemSaida >= 30 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                        {p.diasSemSaida >= 999 ? 'Nunca' : `${p.diasSemSaida}d`}
                      </td>
                      <td>
                        <span className="badge" style={{ background: cfg.bg, color: cfg.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-soft)', maxWidth: 200 }}>
                        {p.sugestao}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
