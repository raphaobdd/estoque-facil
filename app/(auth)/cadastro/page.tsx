'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Package, Eye, EyeOff, ArrowRight, Check } from 'lucide-react'

const SEGMENTOS = [
  'Mercado / Mercearia',
  'Loja de conveniência',
  'Restaurante / Lanchonete',
  'Cafeteria / Padaria',
  'Loja de roupas / Moda',
  'Pet Shop',
  'Loja de cosméticos',
  'Loja de materiais',
  'Oficina / Auto peças',
  'Distribuidor',
  'Outro',
]

export default function CadastroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nomeNegocio: '',
    segmento: '',
    nomeResponsavel: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('As senhas não conferem.')
      return
    }
    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)

    // 1. Criar conta no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { nome: form.nomeResponsavel },
      },
    })

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }

    // 2. Criar empresa e perfil via API
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nomeNegocio: form.nomeNegocio,
        segmento: form.segmento,
        nomeResponsavel: form.nomeResponsavel,
        userId: authData.user.id,
        email: form.email,
      }),
    })

    if (!res.ok) {
      setError('Erro ao configurar sua conta. Entre em contato com o suporte.')
      setLoading(false)
      return
    }

    router.push('/onboarding')
  }

  return (
    <div className="auth-layout">
      <div className="auth-panel">
        <div className="auth-box fade-in">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <Package size={22} strokeWidth={2.5} />
            </div>
            <span className="auth-logo-name">Estoque Fácil</span>
          </div>

          {/* Step indicator */}
          <div className="step-indicator">
            {[1, 2].map(s => (
              <div key={s} className={`step-dot ${step === s ? 'active' : step > s ? 'done' : ''}`} />
            ))}
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {step === 1 && (
              <>
                <h1 className="auth-title" style={{ marginBottom: 0 }}>Sobre seu negócio</h1>
                <p className="auth-subtitle" style={{ marginBottom: 'var(--space-2)' }}>Vamos personalizar o sistema para você.</p>

                <div className="form-group">
                  <label htmlFor="nomeNegocio" className="form-label required">Nome do negócio</label>
                  <input
                    id="nomeNegocio"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Mercadinho do João"
                    value={form.nomeNegocio}
                    onChange={e => updateForm('nomeNegocio', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="segmento" className="form-label required">Segmento</label>
                  <select
                    id="segmento"
                    className="form-select"
                    value={form.segmento}
                    onChange={e => updateForm('segmento', e.target.value)}
                    required
                  >
                    <option value="">Selecione o segmento</option>
                    {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="nomeResponsavel" className="form-label required">Seu nome</label>
                  <input
                    id="nomeResponsavel"
                    type="text"
                    className="form-input"
                    placeholder="Nome do responsável"
                    value={form.nomeResponsavel}
                    onChange={e => updateForm('nomeResponsavel', e.target.value)}
                    required
                  />
                </div>

                <button
                  type="button"
                  id="btn-next-step"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: 'var(--space-2)' }}
                  disabled={!form.nomeNegocio || !form.segmento || !form.nomeResponsavel}
                  onClick={() => setStep(2)}
                >
                  Continuar <ArrowRight size={18} />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="auth-title" style={{ marginBottom: 0 }}>Crie seu acesso</h1>
                <p className="auth-subtitle" style={{ marginBottom: 'var(--space-2)' }}>E-mail e senha para entrar no sistema.</p>

                <div className="form-group">
                  <label htmlFor="email" className="form-label required">E-mail</label>
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    placeholder="seunome@empresa.com"
                    value={form.email}
                    onChange={e => updateForm('email', e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label required">Senha</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Mínimo 6 caracteres"
                      value={form.password}
                      onChange={e => updateForm('password', e.target.value)}
                      required
                      style={{ paddingRight: '3rem' }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="btn btn-ghost btn-icon" style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label required">Confirmar senha</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="form-input"
                    placeholder="Repita a senha"
                    value={form.confirmPassword}
                    onChange={e => updateForm('confirmPassword', e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                  <button type="button" className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={() => setStep(1)}>
                    Voltar
                  </button>
                  <button
                    id="btn-criar-conta"
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{ flex: 2 }}
                    disabled={loading || !form.email || !form.password || !form.confirmPassword}
                  >
                    {loading ? <span className="spinner" /> : <><Check size={18} /> Criar conta</>}
                  </button>
                </div>
              </>
            )}
          </form>

          <p style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-soft)', marginTop: 'var(--space-6)' }}>
            Já tem conta?{' '}
            <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Entrar</Link>
          </p>
        </div>
      </div>

      {/* Brand panel */}
      <div className="auth-brand-panel">
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07 }}>
          <div style={{ position: 'absolute', top: '10%', left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'white' }} />
        </div>
        <div className="auth-brand-content">
          <p className="auth-brand-tagline">Configure em minutos. Controle para sempre.</p>
          <p className="auth-brand-desc">
            Sem treinamento, sem consultor, sem contrato longo. Cadastre seus produtos e comece a controlar o estoque hoje mesmo.
          </p>
          <div style={{ marginTop: 'var(--space-8)', padding: 'var(--space-5)', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-xl)', backdropFilter: 'blur(8px)' }}>
            <p style={{ color: 'white', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>✅ 14 dias grátis</p>
            <p style={{ color: 'white', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>✅ Sem cartão de crédito</p>
            <p style={{ color: 'white', fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>✅ Cancele quando quiser</p>
          </div>
        </div>
      </div>
    </div>
  )
}
