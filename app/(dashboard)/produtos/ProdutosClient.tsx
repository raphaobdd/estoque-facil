'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Filter, Package, X, ChevronRight, Edit2, Archive } from 'lucide-react'
import type { Produto, Categoria } from '@/types'
import { formatCurrency } from '@/lib/utils'

const UNIDADES = ['unidade', 'caixa', 'pacote', 'quilo', 'grama', 'litro', 'metro']

interface Props {
  produtosIniciais: Produto[]
  categorias: Categoria[]
  empresaId: string
  userId: string
  userPerfil: string
}

interface FormData {
  nome: string
  categoria_id: string
  unidade_medida: string
  estoque_atual: string
  estoque_minimo: string
  custo_unitario: string
  preco_venda: string
  codigo_interno: string
  fornecedor: string
  detalhesAbertos: boolean
}

const FORM_INICIAL: FormData = {
  nome: '', categoria_id: '', unidade_medida: 'unidade',
  estoque_atual: '', estoque_minimo: '',
  custo_unitario: '', preco_venda: '', codigo_interno: '', fornecedor: '',
  detalhesAbertos: false,
}

export default function ProdutosClient({ produtosIniciais, categorias, empresaId, userId, userPerfil }: Props) {
  const supabase = createClient()
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais)
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'baixo' | 'ok'>('todos')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Produto | null>(null)
  const [form, setForm] = useState<FormData>(FORM_INICIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [produtoDetalhe, setProdutoDetalhe] = useState<Produto | null>(null)

  const canEdit = userPerfil === 'admin'

  function updateForm(field: keyof FormData, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function abrirModal(produto?: Produto) {
    if (produto) {
      setEditando(produto)
      setForm({
        nome: produto.nome,
        categoria_id: produto.categoria_id ?? '',
        unidade_medida: produto.unidade_medida,
        estoque_atual: String(produto.estoque_atual),
        estoque_minimo: String(produto.estoque_minimo),
        custo_unitario: produto.custo_unitario ? String(produto.custo_unitario) : '',
        preco_venda: produto.preco_venda ? String(produto.preco_venda) : '',
        codigo_interno: produto.codigo_interno ?? '',
        fornecedor: produto.fornecedor ?? '',
        detalhesAbertos: !!(produto.custo_unitario || produto.preco_venda || produto.codigo_interno || produto.fornecedor),
      })
    } else {
      setEditando(null)
      setForm(FORM_INICIAL)
    }
    setError('')
    setModalAberto(true)
  }

  async function salvarProduto() {
    setError('')
    if (!form.nome.trim()) { setError('Nome é obrigatório.'); return }
    setLoading(true)

    const payload = {
      empresa_id: empresaId,
      nome: form.nome.trim(),
      categoria_id: form.categoria_id || null,
      unidade_medida: form.unidade_medida,
      estoque_atual: Number(form.estoque_atual) || 0,
      estoque_minimo: Number(form.estoque_minimo) || 0,
      custo_unitario: form.custo_unitario ? Number(form.custo_unitario) : null,
      preco_venda: form.preco_venda ? Number(form.preco_venda) : null,
      codigo_interno: form.codigo_interno || null,
      fornecedor: form.fornecedor || null,
    }

    if (editando) {
      const { data, error: err } = await supabase.from('produtos').update(payload).eq('id', editando.id).select('*, categoria:categorias(id, nome)').single()
      if (err || !data) { setError('Erro ao atualizar produto.'); setLoading(false); return }
      setProdutos(prev => prev.map(p => p.id === editando.id ? data : p))
    } else {
      const { data, error: err } = await supabase.from('produtos').insert(payload).select('*, categoria:categorias(id, nome)').single()
      if (err || !data) { setError('Erro ao criar produto.'); setLoading(false); return }
      setProdutos(prev => [data, ...prev])

      // Criar alerta de reposição se necessário
      if (data.estoque_atual <= data.estoque_minimo && data.estoque_minimo > 0) {
        await supabase.from('alertas').insert({
          empresa_id: empresaId,
          produto_id: data.id,
          tipo: 'reposicao',
          mensagem: `${data.nome} está abaixo do estoque mínimo (${data.estoque_atual}/${data.estoque_minimo} ${data.unidade_medida}).`,
        })
      }
    }

    setLoading(false)
    setModalAberto(false)
  }

  async function arquivarProduto(id: string) {
    if (!confirm('Deseja arquivar este produto? Ele não aparecerá mais nas movimentações, mas o histórico será mantido.')) return
    await supabase.from('produtos').update({ ativo: false }).eq('id', id)
    setProdutos(prev => prev.filter(p => p.id !== id))
  }

  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => {
      const matchBusca = !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.codigo_interno?.toLowerCase().includes(busca.toLowerCase())
      const matchCat = !filtroCategoria || p.categoria_id === filtroCategoria
      const matchStatus = filtroStatus === 'todos' || (filtroStatus === 'baixo' ? p.estoque_atual <= p.estoque_minimo : p.estoque_atual > p.estoque_minimo)
      return matchBusca && matchCat && matchStatus
    })
  }, [produtos, busca, filtroCategoria, filtroStatus])

  const getStatusClass = (p: Produto) => {
    if (p.estoque_atual <= 0) return 'baixo'
    if (p.estoque_atual <= p.estoque_minimo) return 'atencao'
    return 'ok'
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Produtos</h1>
          <p className="page-subtitle">{produtos.length} produto{produtos.length !== 1 ? 's' : ''} cadastrado{produtos.length !== 1 ? 's' : ''}</p>
        </div>
        {canEdit && (
          <button id="btn-novo-produto" className="btn btn-primary" onClick={() => abrirModal()}>
            <Plus size={16} /> Novo produto
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="card-body" style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div className="search-bar" style={{ flex: '1 1 200px' }}>
            <Search size={16} className="search-icon" />
            <input
              className="form-input"
              placeholder="Buscar produto..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              id="input-busca-produto"
            />
          </div>
          <select className="form-select" style={{ flex: '0 1 160px' }} value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
            <option value="">Todas categorias</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {(['todos', 'baixo', 'ok'] as const).map(s => (
              <button
                key={s}
                className={`btn btn-sm ${filtroStatus === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFiltroStatus(s)}
              >
                {s === 'todos' ? 'Todos' : s === 'baixo' ? 'Abaixo mínimo' : 'OK'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="table-container">
        {produtosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Package size={28} /></div>
            <p className="empty-state-title">Nenhum produto encontrado</p>
            <p className="empty-state-desc">
              {busca ? 'Tente outra busca.' : 'Cadastre seu primeiro produto.'}
            </p>
            {canEdit && !busca && (
              <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }} onClick={() => abrirModal()}>
                <Plus size={16} /> Cadastrar produto
              </button>
            )}
          </div>
        ) : (
          produtosFiltrados.map(p => (
            <div key={p.id} className="produto-row" onClick={() => setProdutoDetalhe(p)}>
              <div className="produto-avatar">
                {p.foto_url ? <img src={p.foto_url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={22} color="var(--color-text-muted)" />}
              </div>
              <div className="produto-info">
                <div className="produto-nome">{p.nome}</div>
                <div className="produto-categoria">{(p.categoria as Categoria | null)?.nome ?? 'Sem categoria'}</div>
              </div>
              <div className="produto-estoque">
                <div className={`produto-qtd ${getStatusClass(p)}`}>
                  {p.estoque_atual} {p.unidade_medida}
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  mín: {p.estoque_minimo}
                </div>
              </div>
              <ChevronRight size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
            </div>
          ))
        )}
      </div>

      {/* Modal Detalhe */}
      {produtoDetalhe && (
        <div className="modal-overlay" onClick={() => setProdutoDetalhe(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontWeight: 700 }}>{produtoDetalhe.nome}</h3>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-soft)' }}>
                  {(produtoDetalhe.categoria as Categoria | null)?.nome ?? 'Sem categoria'}
                </p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setProdutoDetalhe(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                {[
                  { label: 'Estoque atual', value: `${produtoDetalhe.estoque_atual} ${produtoDetalhe.unidade_medida}`, color: getStatusClass(produtoDetalhe) === 'ok' ? 'var(--color-success)' : 'var(--color-danger)' },
                  { label: 'Estoque mínimo', value: `${produtoDetalhe.estoque_minimo} ${produtoDetalhe.unidade_medida}` },
                  { label: 'Custo unitário', value: formatCurrency(produtoDetalhe.custo_unitario) },
                  { label: 'Preço de venda', value: formatCurrency(produtoDetalhe.preco_venda) },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: 'var(--color-surface-2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: color ?? 'var(--color-text)' }}>{value}</div>
                  </div>
                ))}
              </div>
              {produtoDetalhe.fornecedor && (
                <div>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Fornecedor</span>
                  <p style={{ fontWeight: 500 }}>{produtoDetalhe.fornecedor}</p>
                </div>
              )}
            </div>
            {canEdit && (
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => { setProdutoDetalhe(null); arquivarProduto(produtoDetalhe.id) }}>
                  <Archive size={16} /> Arquivar
                </button>
                <button className="btn btn-primary" onClick={() => { setProdutoDetalhe(null); abrirModal(produtoDetalhe) }}>
                  <Edit2 size={16} /> Editar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Criar/Editar */}
      {modalAberto && (
        <div className="modal-overlay" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>{editando ? 'Editar produto' : 'Novo produto'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalAberto(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}

              <div className="form-group">
                <label className="form-label required">Nome do produto</label>
                <input id="input-nome-produto" className="form-input" placeholder="Ex: Arroz 5kg" value={form.nome} onChange={e => updateForm('nome', e.target.value)} autoFocus />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label required">Qtd. atual</label>
                  <input className="form-input" type="number" min="0" placeholder="0" value={form.estoque_atual} onChange={e => updateForm('estoque_atual', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label required">Qtd. mínima</label>
                  <input className="form-input" type="number" min="0" placeholder="0" value={form.estoque_minimo} onChange={e => updateForm('estoque_minimo', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Unidade</label>
                  <select className="form-select" value={form.unidade_medida} onChange={e => updateForm('unidade_medida', e.target.value)}>
                    {UNIDADES.map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select className="form-select" value={form.categoria_id} onChange={e => updateForm('categoria_id', e.target.value)}>
                    <option value="">Sem categoria</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
              </div>

              {/* Detalhes avançados */}
              <button
                type="button"
                style={{ background: 'none', color: 'var(--color-primary)', fontWeight: 600, fontSize: 'var(--font-size-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', cursor: 'pointer' }}
                onClick={() => updateForm('detalhesAbertos', !form.detalhesAbertos)}
              >
                <ChevronRight size={16} style={{ transform: form.detalhesAbertos ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                {form.detalhesAbertos ? 'Ocultar' : 'Mais'} detalhes
              </button>

              {form.detalhesAbertos && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} className="slide-up">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="form-group">
                      <label className="form-label">Custo unitário (R$)</label>
                      <input className="form-input" type="number" min="0" step="0.01" placeholder="0,00" value={form.custo_unitario} onChange={e => updateForm('custo_unitario', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Preço de venda (R$)</label>
                      <input className="form-input" type="number" min="0" step="0.01" placeholder="0,00" value={form.preco_venda} onChange={e => updateForm('preco_venda', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Código interno</label>
                    <input className="form-input" placeholder="SKU, código de barras..." value={form.codigo_interno} onChange={e => updateForm('codigo_interno', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fornecedor</label>
                    <input className="form-input" placeholder="Nome do fornecedor" value={form.fornecedor} onChange={e => updateForm('fornecedor', e.target.value)} />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
              <button
                id="btn-salvar-produto"
                className="btn btn-primary"
                disabled={loading || !form.nome.trim()}
                onClick={salvarProduto}
              >
                {loading ? <span className="spinner" /> : editando ? 'Salvar alterações' : 'Criar produto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
