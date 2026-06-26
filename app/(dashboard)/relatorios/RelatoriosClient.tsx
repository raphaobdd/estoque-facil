'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Download, BarChart3, Package, AlertTriangle, TrendingDown, Clock, RotateCcw, ShoppingCart } from 'lucide-react'
import { exportToCSV, formatCurrency, formatDate } from '@/lib/utils'

interface Props { empresaId: string; nomeEmpresa: string }

const RELATORIOS = [
  { id: 'estoque-atual', label: 'Estoque Atual', desc: 'Lista completa com quantidade e valor de cada produto.', icon: <Package size={20} />, color: 'var(--color-primary)' },
  { id: 'abaixo-minimo', label: 'Abaixo do Mínimo', desc: 'Produtos que precisam de reposição.', icon: <AlertTriangle size={20} />, color: 'var(--color-danger)' },
  { id: 'entradas-saidas', label: 'Entradas e Saídas', desc: 'Histórico completo de movimentações.', icon: <BarChart3 size={20} />, color: 'var(--color-success)' },
  { id: 'perdas', label: 'Perdas', desc: 'Relatório de perdas com motivo e valor estimado.', icon: <TrendingDown size={20} />, color: 'var(--color-danger)' },
  { id: 'parados', label: 'Produtos Parados', desc: 'Produtos sem saída nos últimos 30 dias.', icon: <Clock size={20} />, color: 'var(--color-warning)' },
  { id: 'reposicao', label: 'Lista de Reposição', desc: 'O que comprar agora com sugestão de quantidade.', icon: <ShoppingCart size={20} />, color: 'var(--color-primary)' },
]

export default function RelatoriosClient({ empresaId, nomeEmpresa }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState<string | null>(null)
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().split('T')[0])

  async function gerarRelatorio(id: string) {
    setLoading(id)

    try {
      switch (id) {
        case 'estoque-atual': {
          const { data } = await supabase
            .from('produtos')
            .select('nome, categoria:categorias(nome), unidade_medida, estoque_atual, estoque_minimo, custo_unitario, preco_venda, fornecedor, codigo_interno')
            .eq('empresa_id', empresaId).eq('ativo', true).order('nome')

          exportToCSV((data ?? []).map(p => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cat = p.categoria as any
            return {
              'Produto': p.nome,
              'Categoria': (Array.isArray(cat) ? cat[0]?.nome : cat?.nome) ?? '',
              'Unidade': p.unidade_medida,
              'Estoque Atual': p.estoque_atual,
              'Estoque Mínimo': p.estoque_minimo,
              'Custo Unitário': p.custo_unitario ?? '',
              'Valor em Estoque': p.custo_unitario ? p.estoque_atual * p.custo_unitario : '',
              'Preço de Venda': p.preco_venda ?? '',
              'Fornecedor': p.fornecedor ?? '',
              'Código Interno': p.codigo_interno ?? '',
            }
          }), `estoque-atual-${dataFim}`)
          break
        }

        case 'abaixo-minimo': {
          const { data } = await supabase
            .from('produtos')
            .select('nome, unidade_medida, estoque_atual, estoque_minimo, custo_unitario')
            .eq('empresa_id', empresaId).eq('ativo', true).order('nome')

          const abaixo = (data ?? []).filter(p => p.estoque_atual <= p.estoque_minimo)
          exportToCSV(abaixo.map(p => ({
            'Produto': p.nome,
            'Unidade': p.unidade_medida,
            'Estoque Atual': p.estoque_atual,
            'Estoque Mínimo': p.estoque_minimo,
            'Diferença': p.estoque_atual - p.estoque_minimo,
            'Comprar (sugestão)': Math.max(0, p.estoque_minimo * 2 - p.estoque_atual),
          })), `abaixo-minimo-${dataFim}`)
          break
        }

        case 'entradas-saidas': {
          const { data } = await supabase
            .from('movimentacoes')
            .select('tipo, quantidade, motivo, observacao, data_movimentacao, produto:produtos(nome, unidade_medida), usuario:perfis(nome)')
            .eq('empresa_id', empresaId)
            .gte('data_movimentacao', dataInicio).lte('data_movimentacao', dataFim)
            .order('data_movimentacao', { ascending: false })

          exportToCSV((data ?? []).map(m => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const prod = m.produto as any
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const usr = m.usuario as any
            return {
              'Data': formatDate(m.data_movimentacao),
              'Tipo': m.tipo,
              'Produto': (Array.isArray(prod) ? prod[0]?.nome : prod?.nome) ?? '',
              'Quantidade': m.quantidade,
              'Unidade': (Array.isArray(prod) ? prod[0]?.unidade_medida : prod?.unidade_medida) ?? '',
              'Motivo': m.motivo ?? '',
              'Observação': m.observacao ?? '',
              'Usuário': (Array.isArray(usr) ? usr[0]?.nome : usr?.nome) ?? '',
            }
          }), `movimentacoes-${dataInicio}-${dataFim}`)
          break
        }

        case 'perdas': {
          const { data } = await supabase
            .from('movimentacoes')
            .select('quantidade, custo_unitario_momento, motivo, observacao, data_movimentacao, produto:produtos(nome, unidade_medida), usuario:perfis(nome)')
            .eq('empresa_id', empresaId).eq('tipo', 'perda')
            .gte('data_movimentacao', dataInicio).lte('data_movimentacao', dataFim)
            .order('data_movimentacao', { ascending: false })

          exportToCSV((data ?? []).map(m => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const prod = m.produto as any
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const usr = m.usuario as any
            return {
              'Data': formatDate(m.data_movimentacao),
              'Produto': (Array.isArray(prod) ? prod[0]?.nome : prod?.nome) ?? '',
              'Quantidade': m.quantidade,
              'Unidade': (Array.isArray(prod) ? prod[0]?.unidade_medida : prod?.unidade_medida) ?? '',
              'Motivo': m.motivo ?? '',
              'Custo Unitário': m.custo_unitario_momento ?? '',
              'Valor Perdido': m.custo_unitario_momento ? m.quantidade * m.custo_unitario_momento : '',
              'Observação': m.observacao ?? '',
              'Usuário': (Array.isArray(usr) ? usr[0]?.nome : usr?.nome) ?? '',
            }
          }), `perdas-${dataInicio}-${dataFim}`)
          break
        }

        case 'parados': {
          const trinta = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          const { data: prods } = await supabase.from('produtos').select('id, nome, unidade_medida, estoque_atual, custo_unitario').eq('empresa_id', empresaId).eq('ativo', true).gt('estoque_atual', 0)
          const { data: movs } = await supabase.from('movimentacoes').select('produto_id').eq('empresa_id', empresaId).in('tipo', ['saida', 'perda']).gte('data_movimentacao', trinta)

          const idsComSaida = new Set((movs ?? []).map((m: { produto_id: string }) => m.produto_id))
          const parados = (prods ?? []).filter(p => !idsComSaida.has(p.id))

          exportToCSV(parados.map(p => ({
            'Produto': p.nome,
            'Unidade': p.unidade_medida,
            'Estoque Atual': p.estoque_atual,
            'Valor em Estoque': p.custo_unitario ? p.estoque_atual * p.custo_unitario : '',
          })), `parados-${dataFim}`)
          break
        }

        case 'reposicao': {
          const { data } = await supabase
            .from('produtos')
            .select('nome, unidade_medida, estoque_atual, estoque_minimo, fornecedor')
            .eq('empresa_id', empresaId).eq('ativo', true).order('nome')

          const reposicao = (data ?? []).filter(p => p.estoque_atual <= p.estoque_minimo)
          exportToCSV(reposicao.map(p => ({
            'Produto': p.nome,
            'Unidade': p.unidade_medida,
            'Estoque Atual': p.estoque_atual,
            'Estoque Mínimo': p.estoque_minimo,
            'Quantidade Sugerida': Math.max(0, p.estoque_minimo * 2 - p.estoque_atual),
            'Fornecedor': p.fornecedor ?? '',
          })), `lista-reposicao-${dataFim}`)
          break
        }
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Relatórios</h1>
        <p className="page-subtitle">Exporte dados do seu estoque em CSV.</p>
      </div>

      {/* Filtro de período */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-body" style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1 1 140px' }}>
            <label className="form-label">Data início</label>
            <input className="form-input" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: '1 1 140px' }}>
            <label className="form-label">Data fim</label>
            <input className="form-input" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
          </div>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', paddingBottom: 'var(--space-3)' }}>
            Período usado em: Entradas/Saídas e Perdas
          </p>
        </div>
      </div>

      {/* Grade de relatórios */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        {RELATORIOS.map(r => (
          <div key={r.id} className="card" style={{ transition: 'box-shadow 0.2s' }}>
            <div className="card-body" style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: r.color + '18', color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {r.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>{r.label}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-soft)', marginTop: 2, lineHeight: 1.4 }}>{r.desc}</div>
                </div>
              </div>
              <button
                id={`btn-exportar-${r.id}`}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
                disabled={loading === r.id}
                onClick={() => gerarRelatorio(r.id)}
              >
                {loading === r.id ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Gerando...</> : <><Download size={14} /> Exportar CSV</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
