'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Crown, Wrench, Eye, Check, X } from 'lucide-react'
import type { PerfilUsuario, Perfil } from '@/types'
import { formatDateTime } from '@/lib/utils'

const PERFIL_CONFIG = {
  admin: { label: 'Administrador', color: 'var(--color-primary)', bg: 'var(--color-primary-light)', icon: <Crown size={14} /> },
  operador: { label: 'Operador', color: 'var(--color-success)', bg: 'var(--color-success-light)', icon: <Wrench size={14} /> },
  visualizador: { label: 'Visualizador', color: 'var(--color-muted)', bg: 'var(--color-surface-2)', icon: <Eye size={14} /> },
}

interface Props {
  usuarios: PerfilUsuario[]
  empresaId: string
  currentUserId: string
}

export default function UsuariosClient({ usuarios: usuariosIniciais, empresaId, currentUserId }: Props) {
  const supabase = createClient()
  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>(usuariosIniciais)
  const [convidarAberto, setConvidarAberto] = useState(false)
  const [emailConvite, setEmailConvite] = useState('')
  const [perfilConvite, setPerfilConvite] = useState<Perfil>('operador')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [error, setError] = useState('')

  async function alterarPerfil(userId: string, novoPerfil: Perfil) {
    await supabase.from('perfis').update({ perfil: novoPerfil }).eq('id', userId)
    setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, perfil: novoPerfil } : u))
  }

  async function alterarStatus(userId: string, ativo: boolean) {
    await supabase.from('perfis').update({ ativo }).eq('id', userId)
    setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, ativo } : u))
  }

  async function convidar() {
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.admin?.inviteUserByEmail?.(emailConvite) ?? { data: null, error: { message: 'Não disponível no cliente' } }

    // No MVP, usar API route para enviar convite
    const res = await fetch('/api/usuarios/convidar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailConvite, perfil: perfilConvite, empresaId }),
    })

    if (!res.ok) {
      setError('Erro ao enviar convite. Verifique o e-mail e tente novamente.')
      setLoading(false)
      return
    }

    setSucesso(`Convite enviado para ${emailConvite}`)
    setEmailConvite('')
    setConvidarAberto(false)
    setLoading(false)
    setTimeout(() => setSucesso(''), 4000)
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Usuários</h1>
          <p className="page-subtitle">{usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''} na sua empresa.</p>
        </div>
        <button id="btn-convidar-usuario" className="btn btn-primary" onClick={() => setConvidarAberto(true)}>
          + Convidar
        </button>
      </div>

      {sucesso && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}><Check size={16} />{sucesso}</div>}

      <div className="table-container">
        {usuarios.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={28} /></div>
            <p className="empty-state-title">Nenhum usuário</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Desde</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => {
                  const cfg = PERFIL_CONFIG[u.perfil]
                  const isMe = u.id === currentUserId
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', flexShrink: 0 }}>
                            {u.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{u.nome} {isMe && <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>(você)</span>}</div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {isMe ? (
                          <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        ) : (
                          <select
                            className="form-select"
                            style={{ padding: '4px 28px 4px 8px', fontSize: 'var(--font-size-xs)', width: 'auto' }}
                            value={u.perfil}
                            onChange={e => alterarPerfil(u.id, e.target.value as Perfil)}
                          >
                            <option value="admin">Administrador</option>
                            <option value="operador">Operador</option>
                            <option value="visualizador">Visualizador</option>
                          </select>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${u.ativo ? 'badge-success' : 'badge-muted'}`}>{u.ativo ? 'Ativo' : 'Inativo'}</span>
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                        {formatDateTime(u.criado_em)}
                      </td>
                      <td>
                        {!isMe && (
                          <button
                            className={`btn btn-sm ${u.ativo ? 'btn-ghost' : 'btn-success'}`}
                            onClick={() => alterarStatus(u.id, !u.ativo)}
                          >
                            {u.ativo ? <><X size={12} /> Desativar</> : <><Check size={12} /> Ativar</>}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal convidar */}
      {convidarAberto && (
        <div className="modal-overlay" onClick={() => setConvidarAberto(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>Convidar usuário</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setConvidarAberto(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="alert alert-info">
                <span>O usuário receberá um e-mail com instruções para criar sua senha e acessar o sistema.</span>
              </div>
              <div className="form-group">
                <label className="form-label required">E-mail do usuário</label>
                <input id="input-email-convite" className="form-input" type="email" placeholder="email@exemplo.com" value={emailConvite} onChange={e => setEmailConvite(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Perfil</label>
                <select className="form-select" value={perfilConvite} onChange={e => setPerfilConvite(e.target.value as Perfil)}>
                  <option value="operador">Operador — pode registrar movimentações</option>
                  <option value="visualizador">Visualizador — apenas leitura</option>
                  <option value="admin">Administrador — acesso completo</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConvidarAberto(false)}>Cancelar</button>
              <button
                id="btn-enviar-convite"
                className="btn btn-primary"
                disabled={loading || !emailConvite}
                onClick={convidar}
              >
                {loading ? <span className="spinner" /> : 'Enviar convite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
