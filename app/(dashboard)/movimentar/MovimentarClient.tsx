'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  TrendingUp, ArrowLeftRight, Minus, RefreshCw, Search, X,
  AlertTriangle, CheckCircle
} from 'lucide-react'
import type { TipoMovimentacao } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface ProdutoItem {
  id: string
  nome: string
  estoque_atual: number
  estoque_minimo: number
  unidade_medida: string
  custo_unitario: number | null
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  produtos: any[]
  empresaId: string
  userId: string
}

const TIPO_CONFIG = {
  entrada: { label: 'Registrar Entrada', desc: 'Informe o que chegou ao estoque.', color: 'var(--color-success)', light: 'var(--color-success-light)', icon: <TrendingUp size={24} />, btn: 'btn-success', btnLabel: 'Confirmar entrada' },
  saida: { label: 'Registrar Saída', desc: 'Informe o que saiu do estoque.', color: 'var(--color-primary)', light: 'var(--color-primary-light)', icon: <ArrowLeftRight size={24} />, btn: 'btn-primary', btnLabel: 'Confirmar saída' },
  perda: { label: 'Registrar Perda', desc: 'Produto vencido, quebrado, furtado ou descartado.', color: 'var(--color-danger)', light: 'var(--color-danger-light)', icon: <Minus size={24} />, btn: 'btn-danger', btnLabel: 'Confirmar perda' },
  ajuste: { label: 'Fazer Contagem', desc: 'Corrija o estoque após conferência física.', color: 'var(--color-warning)', light: 'var(--color-warning-light)', icon: <RefreshCw size={24} />, btn: 'btn-warning', btnLabel: 'Confirmar ajuste' },
}

const MOTIVOS_SAIDA = ['Venda', 'Uso interno', 'Devolução', 'Outro']
const MOTIVOS_PERDA = ['Vencimento', 'Quebra', 'Avaria', 'Furto/Extravio', 'Erro de contagem', 'Outro']
const MOTIVOS_AJUSTE = ['Inventário', 'Erro anterior', 'Correção', 'Outro']

export default function MovimentarClient({ produtos, empresaId, userId }: Props) {
  const searchParams = useSearchParams()
  const tipoParam = (searchParams.get('tipo') ?? 'entrada') as TipoMovimentacao

  const supabase = createClient()
  const [tipo, setTipo] = useState<TipoMovimentacao>(tipoParam)
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoItem | null>(null)
  const [busca, setBusca] = useState('')
  const [mostrarBusca, setMostrarBusca] = useState(false)
  const [quantidade, setQuantidade] = useState('')
  const [motivo, setMotivo] = useState('')
  const [observacao, setObservacao] = useState('')
  const [custo, setCusto] = useState('')
  const [dataMovimentacao, setDataMovimentacao] = useState(new Date().toISOString().split('T')[0])
  const [dataValidade, setDataValidade] = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [aviso, setAviso] = useState('')
  const [confirmandoNegativo, setConfirmandoNegativo] = useState(false)

  useEffect(() => {
    setTipo(tipoParam)
    setProdutoSelecionado(null)
    setQuantidade('')
    setMotivo('')
    setObservacao('')
    setAviso('')
    setSucesso(false)
  }, [tipoParam])

  const cfg = TIPO_CONFIG[tipo]
  const produtosFiltrados = (produtos as ProdutoItem[]).filter(p =>
    !busca || p.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const qtdNum = Number(quantidade)
  const estoqueAnt = produtoSelecionado?.estoque_atual ?? 0
  const estoquePost = tipo === 'entrada'
    ? estoqueAnt + qtdNum
    : tipo === 'ajuste'
      ? qtdNum
      : estoqueAnt - qtdNum

  const valorPerda = tipo === 'perda' && produtoSelecionado?.custo_unitario
    ? qtdNum * produtoSelecionado.custo_unitario
    : null

  function resetForm() {
    setProdutoSelecionado(null)
    setQuantidade('')
    setMotivo('')
    setObservacao('')
    setCusto('')
    setDataValidade('')
    setAviso('')
    setConfirmandoNegativo(false)
    setBusca('')
    setMostrarBusca(false)
  }

  async function confirmar() {
    if (!produtoSelecionado || !quantidade) return

    if ((tipo === 'saida' || tipo === 'perda') && estoquePost < 0 && !confirmandoNegativo) {
      setAviso(`Você possui apenas ${estoqueAnt} ${produtoSelecionado.unidade_medida} em estoque. Deseja continuar mesmo assim?`)
      setConfirmandoNegativo(true)
      return
    }

    setLoading(true)
    setAviso('')

    const { data: movData, error: movErr } = await supabase.from('movimentacoes').insert({
      empresa_id: empresaId,
      produto_id: produtoSelecionado.id,
      usuario_id: userId,
      tipo,
      quantidade: qtdNum,
      estoque_anterior: estoqueAnt,
      estoque_posterior: estoquePost,
      motivo: motivo || null,
      observacao: observacao || null,
      custo_unitario_momento: custo ? Number(custo) : produtoSelecionado.custo_unitario,
      data_movimentacao: dataMovimentacao,
    }).select().single()

    if (movErr || !movData) {
      setAviso('Erro ao registrar movimentação. Tente novamente.')
      setLoading(false)
      return
    }

    await supabase.from('produtos').update({ estoque_atual: estoquePost }).eq('id', produtoSelecionado.id)

    if (tipo === 'entrada' && dataValidade) {
      await supabase.from('lotes_validade').insert({
        empresa_id: empresaId,
        produto_id: produtoSelecionado.id,
        movimentacao_id: movData.id,
        quantidade: qtdNum,
        data_validade: dataValidade,
      })
    }

    if (estoquePost <= produtoSelecionado.estoque_minimo) {
      const { data: alertaExistente } = await supabase
        .from('alertas').select('id')
        .eq('empresa_id', empresaId).eq('produto_id', produtoSelecionado.id)
        .eq('tipo', 'reposicao').eq('status', 'ativo').single()

      if (!alertaExistente) {
        await supabase.from('alertas').insert({
          empresa_id: empresaId,
          produto_id: produtoSelecionado.id,
          tipo: 'reposicao',
          mensagem: `${produtoSelecionado.nome} está abaixo do estoque mínimo (${estoquePost}/${produtoSelecionado.estoque_minimo} ${produtoSelecionado.unidade_medida}).`,
        })
      }
    } else {
      await supabase.from('alertas')
        .update({ status: 'resolvido', resolvido_em: new Date().toISOString() })
        .eq('empresa_id', empresaId).eq('produto_id', produtoSelecionado.id)
        .eq('tipo', 'reposicao').eq('status', 'ativo')
    }

    setLoading(false)
    setSucesso(true)
    produtoSelecionado.estoque_atual = estoquePost

    setTimeout(() => { setSucesso(false); resetForm() }, 2500)
  }

  if (sucesso) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }} className="slide-up">
          <CheckCircle size={64} color="var(--color-success)" strokeWidth={1.5} />
          <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>Registrado!</h2>
          <p style={{ color: 'var(--color-text-soft)' }}>
            {cfg.btnLabel.replace('Confirmar ', '')} de <strong>{produtoSelecionado?.nome}</strong> registrada com sucesso.
          </p>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            Novo estoque: <strong>{estoquePost} {produtoSelecionado?.unidade_medida}</strong>
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Movimentar</h1>
        <p className="page-subtitle">Informe o que entrou, saiu ou foi perdido.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        {(Object.entries(TIPO_CONFIG) as [TipoMovimentacao, typeof TIPO_CONFIG.entrada][]).map(([t, c]) => (
          <button
            key={t}
            id={`btn-tipo-${t}`}
            onClick={() => { setTipo(t); resetForm() }}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              padding: 'var(--space-4)', borderRadius: 'var(--radius-xl)',
              border: `2px solid ${tipo === t ? c.color : 'var(--color-border)'}`,
              background: tipo === t ? c.light : 'var(--color-surface)',
              cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
            }}
          >
            <div style={{ color: c.color }}>{c.icon}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>
                {t === 'entrada' ? 'Chegou mercadoria' : t === 'saida' ? 'Venda / uso' : t === 'perda' ? 'Vencido / quebrado' : 'Contar estoque'}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 style={{ fontWeight: 700 }}>{cfg.label}</h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-soft)' }}>{cfg.desc}</p>
          </div>
          <div style={{ color: cfg.color }}>{cfg.icon}</div>
        </div>

        <div className="modal-body">
          {aviso && (
            <div className="alert alert-warning">
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 600 }}>{aviso}</p>
                {confirmandoNegativo && (
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => { setAviso(''); setConfirmandoNegativo(false) }}>Cancelar</button>
                    <button className="btn btn-sm btn-danger" onClick={confirmar}>Sim, continuar</button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label required">Produto</label>
            {produtoSelecionado ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--color-border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{produtoSelecionado.nome}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    Estoque atual: <strong>{produtoSelecionado.estoque_atual} {produtoSelecionado.unidade_medida}</strong>
                  </div>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => setProdutoSelecionado(null)}><X size={16} /></button>
              </div>
            ) : (
              <div>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    id="input-busca-movimentacao"
                    className="form-input"
                    placeholder="Buscar produto..."
                    value={busca}
                    onChange={e => { setBusca(e.target.value); setMostrarBusca(true) }}
                    onFocus={() => setMostrarBusca(true)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
                {mostrarBusca && busca && (
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)', maxHeight: 240, overflowY: 'auto', marginTop: 4 }}>
                    {produtosFiltrados.length === 0 ? (
                      <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>Nenhum produto encontrado</div>
                    ) : produtosFiltrados.map(p => (
                      <button
                        key={p.id} type="button"
                        onClick={() => { setProdutoSelecionado(p); setBusca(''); setMostrarBusca(false) }}
                        style={{ width: '100%', padding: 'var(--space-3) var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'none', border: 'none', borderBottom: '1px solid var(--color-border-light)', textAlign: 'left' }}
                      >
                        <span style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>{p.nome}</span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: p.estoque_atual <= p.estoque_minimo ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                          {p.estoque_atual} {p.unidade_medida}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label required">{tipo === 'ajuste' ? 'Quantidade contada' : 'Quantidade'}</label>
            <input
              id="input-quantidade-movimentacao"
              className="form-input" type="number" min="0" step="0.001"
              placeholder={tipo === 'ajuste' ? 'Informe o que você contou...' : 'Ex: 10'}
              value={quantidade} onChange={e => setQuantidade(e.target.value)}
            />
          </div>

          {tipo === 'ajuste' && produtoSelecionado && quantidade && (
            <div style={{ background: 'var(--color-surface-2)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                <span style={{ color: 'var(--color-text-soft)' }}>Sistema registra:</span>
                <strong>{estoqueAnt} {produtoSelecionado.unidade_medida}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                <span style={{ color: 'var(--color-text-soft)' }}>Você contou:</span>
                <strong>{qtdNum} {produtoSelecionado.unidade_medida}</strong>
              </div>
              <div style={{ height: 1, background: 'var(--color-border)', margin: 'var(--space-1) 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', fontWeight: 700, color: estoquePost - estoqueAnt < 0 ? 'var(--color-danger)' : estoquePost - estoqueAnt > 0 ? 'var(--color-success)' : 'var(--color-text)' }}>
                <span>Diferença:</span>
                <span>{estoquePost - estoqueAnt > 0 ? '+' : ''}{estoquePost - estoqueAnt} {produtoSelecionado.unidade_medida}</span>
              </div>
            </div>
          )}

          {valorPerda !== null && valorPerda > 0 && (
            <div className="alert alert-danger">
              <Minus size={16} style={{ flexShrink: 0 }} />
              <span>Valor estimado da perda: <strong>{formatCurrency(valorPerda)}</strong></span>
            </div>
          )}

          {tipo !== 'entrada' && (
            <div className="form-group">
              <label className="form-label">Motivo</label>
              <select className="form-select" value={motivo} onChange={e => setMotivo(e.target.value)}>
                <option value="">Selecionar motivo</option>
                {(tipo === 'saida' ? MOTIVOS_SAIDA : tipo === 'perda' ? MOTIVOS_PERDA : MOTIVOS_AJUSTE).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {tipo === 'entrada' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">Custo unitário (R$)</label>
                <input className="form-input" type="number" min="0" step="0.01"
                  placeholder={produtoSelecionado?.custo_unitario ? String(produtoSelecionado.custo_unitario) : '0,00'}
                  value={custo} onChange={e => setCusto(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Data de validade</label>
                <input className="form-input" type="date" value={dataValidade} onChange={e => setDataValidade(e.target.value)} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Data</label>
            <input className="form-input" type="date" value={dataMovimentacao} onChange={e => setDataMovimentacao(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Observação (opcional)</label>
            <textarea className="form-textarea" placeholder="Alguma observação adicional..."
              value={observacao} onChange={e => setObservacao(e.target.value)} style={{ minHeight: 80 }} />
          </div>
        </div>

        <div className="modal-footer" style={{ gap: 'var(--space-3)' }}>
          <button
            id={`btn-confirmar-${tipo}`}
            className={`btn ${cfg.btn} btn-lg`}
            style={{ flex: 1 }}
            disabled={loading || !produtoSelecionado || !quantidade || !!aviso}
            onClick={confirmar}
          >
            {loading ? <span className="spinner" /> : cfg.btnLabel}
          </button>
        </div>
      </div>
    </>
  )
}
