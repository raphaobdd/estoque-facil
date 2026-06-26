'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Package, TrendingDown, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react'

const UNIDADES = ['unidade', 'caixa', 'pacote', 'quilo', 'grama', 'litro', 'metro']

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [produto, setProduto] = useState({
    nome: '',
    unidade_medida: 'unidade',
    estoque_atual: '',
    estoque_minimo: '',
  })

  const [produtoId, setProdutoId] = useState<string | null>(null)

  const [movimentacao, setMovimentacao] = useState({
    tipo: 'entrada' as 'entrada' | 'saida',
    quantidade: '',
    observacao: '',
  })

  async function criarProduto() {
    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: perfil } = await supabase
      .from('perfis').select('empresa_id').eq('id', user.id).single()
    if (!perfil?.empresa_id) { setLoading(false); return }

    const { data, error: err } = await supabase
      .from('produtos')
      .insert({
        empresa_id: perfil.empresa_id,
        nome: produto.nome,
        unidade_medida: produto.unidade_medida,
        estoque_atual: Number(produto.estoque_atual) || 0,
        estoque_minimo: Number(produto.estoque_minimo) || 0,
      })
      .select()
      .single()

    if (err || !data) {
      setError('Erro ao criar produto. Tente novamente.')
      setLoading(false)
      return
    }

    setProdutoId(data.id)
    setLoading(false)
    setStep(3)
  }

  async function registrarMovimentacao() {
    if (!produtoId) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: perfil } = await supabase
      .from('perfis').select('empresa_id').eq('id', user.id).single()
    const { data: prod } = await supabase
      .from('produtos').select('estoque_atual').eq('id', produtoId).single()

    if (!perfil || !prod) { setLoading(false); return }

    const qtd = Number(movimentacao.quantidade)
    const estoqueAnterior = prod.estoque_atual
    const estoquePost = movimentacao.tipo === 'entrada'
      ? estoqueAnterior + qtd
      : estoqueAnterior - qtd

    await supabase.from('movimentacoes').insert({
      empresa_id: perfil.empresa_id,
      produto_id: produtoId,
      usuario_id: user.id,
      tipo: movimentacao.tipo,
      quantidade: qtd,
      estoque_anterior: estoqueAnterior,
      estoque_posterior: estoquePost,
      observacao: movimentacao.observacao || null,
    })

    await supabase.from('produtos').update({ estoque_atual: estoquePost }).eq('id', produtoId)
    await supabase.from('perfis').update({ onboarding_completo: true }).eq('id', user.id)

    setLoading(false)
    setStep(4)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
      <div style={{ width: '100%', maxWidth: 480 }} className="fade-in">

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-primary-light)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)', marginBottom: 'var(--space-4)' }}>
            <Package size={16} color="var(--color-primary)" />
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-primary)' }}>Estoque Fácil</span>
          </div>
          <div className="step-indicator" style={{ justifyContent: 'center' }}>
            {[1, 2, 3].map(s => (
              <div key={s} className={`step-dot ${step === s ? 'active' : step > s ? 'done' : ''}`} />
            ))}
          </div>
        </div>

        {/* STEP 1 — Bem-vindo */}
        {step === 1 && (
          <div className="card slide-up">
            <div className="card-body" style={{ textAlign: 'center', gap: 'var(--space-4)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '3rem', lineHeight: 1 }}>🎉</div>
              <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-text)' }}>
                Bem-vindo ao Estoque Fácil!
              </h1>
              <p style={{ color: 'var(--color-text-soft)', lineHeight: 1.7 }}>
                Vamos configurar tudo em <strong>3 passos rápidos</strong>. Leva menos de 2 minutos.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', textAlign: 'left', background: 'var(--color-surface-2)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
                {['Cadastrar seu primeiro produto', 'Informar o estoque atual', 'Registrar a primeira movimentação'].map((txt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                    <div style={{ width: 24, height: 24, background: 'var(--color-primary)', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    {txt}
                  </div>
                ))}
              </div>
              <button id="btn-start-onboarding" className="btn btn-primary btn-lg" onClick={() => setStep(2)} style={{ marginTop: 'var(--space-2)' }}>
                Vamos começar <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Criar produto */}
        {step === 2 && (
          <div className="card slide-up">
            <div className="card-header">
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>Passo 1 de 3</h2>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-soft)' }}>Cadastre seu primeiro produto</p>
              </div>
              <Package size={20} color="var(--color-primary)" />
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="form-group">
                <label className="form-label required">Nome do produto</label>
                <input className="form-input" placeholder="Ex: Arroz 5kg, Coca-Cola 350ml..." value={produto.nome} onChange={e => setProduto(p => ({ ...p, nome: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label required">Qtd. atual</label>
                  <input className="form-input" type="number" min="0" placeholder="0" value={produto.estoque_atual} onChange={e => setProduto(p => ({ ...p, estoque_atual: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label required">Qtd. mínima</label>
                  <input className="form-input" type="number" min="0" placeholder="0" value={produto.estoque_minimo} onChange={e => setProduto(p => ({ ...p, estoque_minimo: e.target.value }))} />
                  <span className="form-helper">Quando alertar</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Unidade</label>
                <select className="form-select" value={produto.unidade_medida} onChange={e => setProduto(p => ({ ...p, unidade_medida: e.target.value }))}>
                  {UNIDADES.map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="card-footer" style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>Voltar</button>
              <button
                id="btn-criar-produto-onboarding"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={loading || !produto.nome}
                onClick={criarProduto}
              >
                {loading ? <span className="spinner" /> : <>Salvar produto <ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Registrar movimentação */}
        {step === 3 && (
          <div className="card slide-up">
            <div className="card-header">
              <div>
                <h2 style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>Passo 3 de 3</h2>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-soft)' }}>Registre a primeira movimentação</p>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                {(['entrada', 'saida'] as const).map(tipo => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setMovimentacao(m => ({ ...m, tipo }))}
                    style={{
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-lg)',
                      border: `2px solid ${movimentacao.tipo === tipo ? (tipo === 'entrada' ? 'var(--color-success)' : 'var(--color-danger)') : 'var(--color-border)'}`,
                      background: movimentacao.tipo === tipo ? (tipo === 'entrada' ? 'var(--color-success-light)' : 'var(--color-danger-light)') : 'var(--color-surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {tipo === 'entrada' ? <TrendingUp size={24} color="var(--color-success)" /> : <TrendingDown size={24} color="var(--color-danger)" />}
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                      {tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                  </button>
                ))}
              </div>
              <div className="form-group">
                <label className="form-label required">Quantidade</label>
                <input className="form-input" type="number" min="1" placeholder="Ex: 10" value={movimentacao.quantidade} onChange={e => setMovimentacao(m => ({ ...m, quantidade: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Observação (opcional)</label>
                <input className="form-input" placeholder="Ex: Chegou fornecedor, vendas do dia..." value={movimentacao.observacao} onChange={e => setMovimentacao(m => ({ ...m, observacao: e.target.value }))} />
              </div>
            </div>
            <div className="card-footer" style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button className="btn btn-secondary" onClick={() => setStep(2)}>Voltar</button>
              <button
                id="btn-registrar-mov-onboarding"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={loading || !movimentacao.quantidade}
                onClick={registrarMovimentacao}
              >
                {loading ? <span className="spinner" /> : <>Confirmar <ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 — Concluído */}
        {step === 4 && (
          <div className="card slide-up">
            <div className="card-body" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-10) var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <CheckCircle size={64} color="var(--color-success)" strokeWidth={1.5} />
              </div>
              <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-text)' }}>
                Tudo pronto! 🚀
              </h2>
              <p style={{ color: 'var(--color-text-soft)', lineHeight: 1.7 }}>
                Seu estoque está configurado. Agora você pode gerenciar tudo pelo dashboard.
              </p>
              <button id="btn-ir-dashboard" className="btn btn-primary btn-lg" onClick={() => router.push('/dashboard')}>
                Ir para o dashboard <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
