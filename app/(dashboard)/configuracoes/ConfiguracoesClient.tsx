'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Settings, Building2, User, Bell, Save, Check, Lock, Zap, Crown, Rocket, ExternalLink } from 'lucide-react'
import type { PlanoStatus } from '@/types'

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  perfil: any
  userId: string
  planoStatus?: PlanoStatus
  plano?: string
  trialExpiraEm?: string | null
}

export default function ConfiguracoesClient({ perfil, userId, planoStatus, plano, trialExpiraEm }: Props) {
  const supabase = createClient()

  const empresa = Array.isArray(perfil.empresa) ? perfil.empresa[0] : perfil.empresa

  const [nomeEmpresa, setNomeEmpresa] = useState(empresa?.nome ?? '')
  const [segmento, setSegmento] = useState(empresa?.segmento ?? '')
  const [nomeUsuario, setNomeUsuario] = useState(perfil.nome ?? '')
  const [loading, setLoading] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  // Calcula dias restantes do trial
  const diasTrial = trialExpiraEm
    ? Math.max(0, Math.ceil((new Date(trialExpiraEm).getTime() - Date.now()) / 86400000))
    : 0

  async function handleCheckout(planoKey: 'basic' | 'starter' | 'pro') {
    setLoading('checkout_' + planoKey)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano: planoKey }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading('portal')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(null)
    }
  }

  async function salvarEmpresa() {
    setLoading('empresa')
    await supabase.from('empresas').update({ nome: nomeEmpresa, segmento }).eq('id', perfil.empresa_id)
    setSucesso('empresa')
    setLoading(null)
    setTimeout(() => setSucesso(null), 3000)
  }

  async function salvarPerfil() {
    setLoading('perfil')
    await supabase.from('perfis').update({ nome: nomeUsuario }).eq('id', userId)
    setSucesso('perfil')
    setLoading(null)
    setTimeout(() => setSucesso(null), 3000)
  }

  const SEGMENTOS = [
    'Mercado / Supermercado', 'Loja de conveniência', 'Restaurante', 'Cafeteria / Padaria',
    'Loja de roupas', 'Pet shop', 'Loja de cosméticos', 'Materiais de construção',
    'Oficina / Automotivo', 'Distribuidora', 'Outro',
  ]

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">Gerencie sua empresa e preferências.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 600 }}>

        {/* Dados da empresa */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: 36, height: 36, background: 'var(--color-primary-light)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                <Building2 size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>Dados da empresa</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Nome e segmento exibidos no sistema</div>
              </div>
            </div>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label required">Nome da empresa</label>
              <input id="input-nome-empresa" className="form-input" value={nomeEmpresa} onChange={e => setNomeEmpresa(e.target.value)} placeholder="Nome do seu negócio" />
            </div>
            <div className="form-group">
              <label className="form-label">Segmento</label>
              <select className="form-select" value={segmento} onChange={e => setSegmento(e.target.value)}>
                <option value="">Selecionar segmento</option>
                {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            {sucesso === 'empresa' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-success)', fontSize: 'var(--font-size-sm)' }}>
                <Check size={16} /> Salvo!
              </span>
            )}
            <button
              id="btn-salvar-empresa"
              className="btn btn-primary"
              disabled={loading === 'empresa' || !nomeEmpresa}
              onClick={salvarEmpresa}
            >
              {loading === 'empresa' ? <span className="spinner" /> : <><Save size={16} /> Salvar</>}
            </button>
          </div>
        </div>

        {/* Dados do usuário */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: 36, height: 36, background: 'var(--color-success-light)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
                <User size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>Meu perfil</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Seu nome de exibição no sistema</div>
              </div>
            </div>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label required">Seu nome</label>
              <input id="input-nome-usuario" className="form-input" value={nomeUsuario} onChange={e => setNomeUsuario(e.target.value)} placeholder="Seu nome completo" />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input className="form-input" value={perfil.email ?? ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>O e-mail não pode ser alterado.</p>
            </div>
          </div>
          <div className="modal-footer">
            {sucesso === 'perfil' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-success)', fontSize: 'var(--font-size-sm)' }}>
                <Check size={16} /> Salvo!
              </span>
            )}
            <button
              id="btn-salvar-perfil"
              className="btn btn-primary"
              disabled={loading === 'perfil' || !nomeUsuario}
              onClick={salvarPerfil}
            >
              {loading === 'perfil' ? <span className="spinner" /> : <><Save size={16} /> Salvar</>}
            </button>
          </div>
        </div>

        {/* Plano & Assinatura */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: 36, height: 36, background: 'var(--color-warning-light)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)' }}>
                <Bell size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>Plano & Assinatura</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Gerencie seu plano StockHome</div>
              </div>
            </div>
          </div>
          <div className="card-body" style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

            {/* Status atual */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', textTransform: 'capitalize' }}>
                  {plano === 'trial' || !plano ? 'Trial' : plano === 'basic' ? 'Basic' : plano === 'starter' ? 'Starter' : 'Pro'}
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-soft)' }}>
                  {planoStatus === 'trial'
                    ? diasTrial > 0 ? `${diasTrial} dias restantes de trial` : 'Trial expirado'
                    : planoStatus === 'ativo' ? 'Assinatura ativa'
                    : planoStatus === 'cancelado' ? 'Assinatura cancelada'
                    : 'Assinatura expirada'}
                </div>
              </div>
              <span className={`badge ${planoStatus === 'ativo' ? 'badge-success' : planoStatus === 'trial' && diasTrial > 0 ? 'badge-primary' : 'badge-danger'}`}
                style={{ padding: '4px 12px', fontWeight: 700 }}>
                {planoStatus === 'ativo' ? 'Ativo' : planoStatus === 'trial' ? 'Trial' : 'Inativo'}
              </span>
            </div>

            {/* Cards dos planos */}
            {(planoStatus !== 'ativo' || plano === 'basic') && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
                {/* Basic */}
                {(planoStatus !== 'ativo' || plano !== 'basic') && (
                  <div style={{ border: '2px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Zap size={16} color="var(--color-primary)" />
                      <span style={{ fontWeight: 700 }}>Basic</span>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800 }}>R$ 29<span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 400 }}>,90/mês</span></div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-soft)' }}>Até 10 produtos</div>
                    <button id="btn-assinar-basic" className="btn btn-secondary" style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}
                      disabled={loading === 'checkout_basic'} onClick={() => handleCheckout('basic')}>
                      {loading === 'checkout_basic' ? <span className="spinner" /> : 'Assinar'}
                    </button>
                  </div>
                )}

                {/* Starter */}
                {(planoStatus !== 'ativo' || !['starter', 'pro'].includes(plano ?? '')) && (
                  <div style={{ border: '2px solid var(--color-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--color-primary)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>POPULAR</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Crown size={16} color="var(--color-primary)" />
                      <span style={{ fontWeight: 700 }}>Starter</span>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800 }}>R$ 59<span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 400 }}>,90/mês</span></div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-soft)' }}>Até 50 produtos</div>
                    <button id="btn-assinar-starter" className="btn btn-primary" style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}
                      disabled={loading === 'checkout_starter'} onClick={() => handleCheckout('starter')}>
                      {loading === 'checkout_starter' ? <span className="spinner" /> : 'Assinar'}
                    </button>
                  </div>
                )}

                {/* Pro */}
                {plano !== 'pro' && (
                  <div style={{ border: '2px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Rocket size={16} color="var(--color-warning)" />
                      <span style={{ fontWeight: 700 }}>Pro</span>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800 }}>R$ 99<span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 400 }}>,90/mês</span></div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-soft)' }}>Produtos ilimitados</div>
                    <button id="btn-assinar-pro" className="btn btn-secondary" style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}
                      disabled={loading === 'checkout_pro'} onClick={() => handleCheckout('pro')}>
                      {loading === 'checkout_pro' ? <span className="spinner" /> : 'Assinar'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Gerenciar assinatura (só para assinantes) */}
            {planoStatus === 'ativo' && (
              <button id="btn-gerenciar-assinatura" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                disabled={loading === 'portal'} onClick={handlePortal}>
                {loading === 'portal' ? <span className="spinner" /> : <><ExternalLink size={16} /> Gerenciar assinatura</>}
              </button>
            )}
          </div>
        </div>

        {/* Zona de perigo */}
        <div className="card" style={{ borderColor: 'var(--color-danger-light)' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: 36, height: 36, background: 'var(--color-danger-light)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-danger)' }}>
                <Lock size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-danger)' }}>Zona de risco</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Ações irreversíveis</div>
              </div>
            </div>
          </div>
          <div className="card-body" style={{ padding: 'var(--space-4) var(--space-5)' }}>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-soft)', marginBottom: 'var(--space-3)' }}>
              Para excluir sua conta ou empresa, entre em contato com o suporte.
            </p>
            <a href="mailto:suporte@estoquefacil.app" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 500 }}>
              suporte@stockhome.app
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
