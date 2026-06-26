'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Settings, Building2, User, Bell, Save, Check, Lock } from 'lucide-react'

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  perfil: any
  userId: string
}

export default function ConfiguracoesClient({ perfil, userId }: Props) {
  const supabase = createClient()

  const empresa = Array.isArray(perfil.empresa) ? perfil.empresa[0] : perfil.empresa

  const [nomeEmpresa, setNomeEmpresa] = useState(empresa?.nome ?? '')
  const [segmento, setSegmento] = useState(empresa?.segmento ?? '')
  const [nomeUsuario, setNomeUsuario] = useState(perfil.nome ?? '')
  const [loading, setLoading] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

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

        {/* Info do plano */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: 36, height: 36, background: 'var(--color-warning-light)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)' }}>
                <Bell size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>Plano atual</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Informações sobre sua assinatura</div>
              </div>
            </div>
          </div>
          <div className="card-body" style={{ padding: 'var(--space-4) var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', textTransform: 'capitalize' }}>
                  {empresa?.plano ?? 'gratuito'}
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-soft)' }}>
                  {empresa?.plano === 'gratuito' ? 'Até 50 produtos · 1 usuário' : 'Produtos ilimitados · Múltiplos usuários'}
                </div>
              </div>
              {empresa?.plano === 'gratuito' && (
                <span className="badge badge-primary" style={{ padding: '4px 12px', fontWeight: 700 }}>Em breve: Pro</span>
              )}
            </div>
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
              suporte@estoquefacil.app
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
