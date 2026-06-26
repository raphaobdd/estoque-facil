'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { TrendingDown, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Produto } from '@/types'

interface PerdaRow {
  produto_id?: string
  quantidade: number
  custo_unitario_momento: number | null
  motivo: string | null
  data_movimentacao?: string
}

interface PerdaDetalhe {
  id: string
  quantidade: number
  custo_unitario_momento: number | null
  motivo: string | null
  observacao: string | null
  data_movimentacao: string
  produto?: { id: string; nome: string; unidade_medida: string } | null
}

interface Props {
  perdasMes: PerdaRow[]
  perdasMesAnterior: PerdaRow[]
  perdasDetalhe: PerdaDetalhe[]
}

const COLORS_MOTIVO = ['#DC2626', '#F97316', '#EAB308', '#8B5CF6', '#06B6D4', '#64748B']
const MOTIVOS_LABELS: Record<string, string> = {
  'Vencimento': 'Vencimento', 'Quebra': 'Quebra', 'Avaria': 'Avaria',
  'Furto/Extravio': 'Furto', 'Erro de contagem': 'Erro', 'Outro': 'Outro',
}

export default function PerdasClient({ perdasMes, perdasMesAnterior, perdasDetalhe }: Props) {
  const totalQtdMes = perdasMes.reduce((a, p) => a + p.quantidade, 0)
  const totalValorMes = perdasMes.reduce((a, p) => a + p.quantidade * (p.custo_unitario_momento ?? 0), 0)
  const totalValorMesAnt = perdasMesAnterior.reduce((a, p) => a + p.quantidade * (p.custo_unitario_momento ?? 0), 0)
  const variacaoPerc = totalValorMesAnt > 0
    ? ((totalValorMes - totalValorMesAnt) / totalValorMesAnt) * 100
    : null

  // Por produto
  const porProduto = useMemo(() => {
    const mapa: Record<string, { nome: string; qtd: number; valor: number }> = {}
    perdasMes.forEach(p => {
      const key = p.produto_id ?? 'desconhecido'
      if (!mapa[key]) mapa[key] = { nome: key, qtd: 0, valor: 0 }
      mapa[key].qtd += p.quantidade
      mapa[key].valor += p.quantidade * (p.custo_unitario_momento ?? 0)
    })

    // Enriquecer com nomes dos produtos do detalhe
    perdasDetalhe.forEach(d => {
      if (d.produto && mapa[d.produto.id]) {
        mapa[d.produto.id].nome = d.produto.nome
      }
    })

    return Object.values(mapa).sort((a, b) => b.qtd - a.qtd).slice(0, 8)
  }, [perdasMes, perdasDetalhe])

  // Por motivo
  const porMotivo = useMemo(() => {
    const mapa: Record<string, number> = {}
    perdasMes.forEach(p => {
      const m = p.motivo ?? 'Outro'
      mapa[m] = (mapa[m] ?? 0) + p.quantidade
    })
    return Object.entries(mapa).map(([name, value]) => ({ name: MOTIVOS_LABELS[name] ?? name, value }))
  }, [perdasMes])

  // Insight principal
  const topProduto = porProduto[0]
  const topMotivo = porMotivo.sort((a, b) => b.value - a.value)[0]
  const percTop = topProduto && totalQtdMes > 0 ? Math.round((topProduto.qtd / totalQtdMes) * 100) : 0

  const hasData = perdasMes.length > 0

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Perdas</h1>
        <p className="page-subtitle">Acompanhe as perdas de estoque deste mês.</p>
      </div>

      {/* Cards resumo */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--color-danger-light)' }}>
            <TrendingDown size={22} color="var(--color-danger)" />
          </div>
          <div className="stat-card-value" style={{ color: 'var(--color-danger)' }}>
            {Math.round(totalQtdMes)}
          </div>
          <div className="stat-card-label">Itens perdidos no mês</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--color-danger-light)' }}>
            <Minus size={22} color="var(--color-danger)" />
          </div>
          <div className="stat-card-value">
            {totalValorMes > 0 ? formatCurrency(totalValorMes) : '—'}
          </div>
          <div className="stat-card-label">Valor estimado perdido</div>
          {variacaoPerc !== null && (
            <div className="stat-card-sub" style={{ color: variacaoPerc > 0 ? 'var(--color-danger)' : 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {variacaoPerc > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              {Math.abs(variacaoPerc).toFixed(1)}% vs mês anterior
            </div>
          )}
        </div>

        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-3)' }}>Insights do mês</div>
          {!hasData ? (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-soft)' }}>Nenhuma perda registrada este mês. 🎉</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {topProduto && percTop > 20 && (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                  🔴 <strong>{topProduto.nome}</strong> representa {percTop}% das perdas deste mês.
                </p>
              )}
              {topMotivo && (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                  📌 <strong>{topMotivo.name}</strong> foi o principal motivo de perda.
                </p>
              )}
              {variacaoPerc !== null && variacaoPerc > 10 && (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)' }}>
                  ⚠️ As perdas aumentaram <strong>{variacaoPerc.toFixed(1)}%</strong> em relação ao mês anterior.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {hasData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
          {/* Gráfico por produto */}
          {porProduto.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>Perdas por produto</h3>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={porProduto} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                    <XAxis dataKey="nome" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any) => [`${value} un.`, 'Quantidade']}
                    />
                    <Bar dataKey="qtd" fill="var(--color-danger)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Gráfico por motivo */}
          {porMotivo.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>Perdas por motivo</h3>
              </div>
              <div className="card-body" style={{ display: 'flex', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={porMotivo} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {porMotivo.map((_, i) => <Cell key={i} fill={COLORS_MOTIVO[i % COLORS_MOTIVO.length]} />)}
                    </Pie>
                    <Tooltip
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(v: any) => [`${v} un.`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Histórico */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>Histórico de perdas</h3>
        </div>
        {perdasDetalhe.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><TrendingDown size={28} /></div>
            <p className="empty-state-title">Nenhuma perda registrada</p>
            <p className="empty-state-desc">Quando você registrar perdas, elas aparecerão aqui.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Motivo</th>
                  <th>Valor est.</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {perdasDetalhe.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.produto?.nome ?? '—'}</td>
                    <td>{p.quantidade} {p.produto?.unidade_medida ?? ''}</td>
                    <td>
                      {p.motivo ? (
                        <span className="badge badge-danger">{p.motivo}</span>
                      ) : '—'}
                    </td>
                    <td>{p.custo_unitario_momento ? formatCurrency(p.quantidade * p.custo_unitario_momento) : '—'}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{formatDate(p.data_movimentacao)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
